using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CommentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CommentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("post/{postId}")]
        public async Task<IActionResult> GetComments(int postId)
        {
            var comments = await _context.Comments
                .Where(c => c.PostId == postId && c.ParentCommentId == null)
                .Include(c => c.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.User)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Content,
                    c.CreatedAt,
                    c.ParentCommentId,
                    User = new { c.User!.Id, c.User.Name, c.User.ProfilePhoto },
                    Replies = c.Replies.OrderBy(r => r.CreatedAt).Select(r => new
                    {
                        r.Id,
                        r.Content,
                        r.CreatedAt,
                        User = new { r.User!.Id, r.User.Name, r.User.ProfilePhoto }
                    }).ToList()
                })
                .ToListAsync();

            return Ok(comments);
        }

        [HttpPost("post/{postId}")]
        public async Task<IActionResult> AddComment(int postId, [FromBody] AddCommentRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
                return NotFound(new { message = "Post not found" });

            var comment = new Comment
            {
                UserId = int.Parse(userId),
                PostId = postId,
                ParentCommentId = request.ParentCommentId,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(int.Parse(userId));

            return Ok(new
            {
                comment.Id,
                comment.Content,
                comment.CreatedAt,
                comment.ParentCommentId,
                User = new { Id = user!.Id, Name = user.Name, user.ProfilePhoto }
            });
        }

        [HttpDelete("{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null)
                return NotFound();

            if (comment.UserId != int.Parse(userId))
                return Forbid();

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Comment deleted" });
        }
    }

    public class AddCommentRequest
    {
        public string Content { get; set; } = string.Empty;
        public int? ParentCommentId { get; set; }
    }
}