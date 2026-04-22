using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.Bio,
                    u.Role,
                    u.IsBanned,
                    u.CreatedAt,
                    PostCount = _context.Posts.Count(p => p.UserId == u.Id),
                    MatchCount = _context.Matches.Count(m => m.User1Id == u.Id || m.User2Id == u.Id)
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var stats = new
            {
                TotalUsers = await _context.Users.CountAsync(),
                TotalPosts = await _context.Posts.CountAsync(),
                TotalMatches = await _context.Matches.CountAsync(),
                TotalComments = await _context.Comments.CountAsync(),
                BannedUsers = await _context.Users.CountAsync(u => u.IsBanned)
            };
            return Ok(stats);
        }

        [HttpDelete("user/{userId}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            // Delete user's posts, comments, reactions, matches, messages
            var posts = _context.Posts.Where(p => p.UserId == userId);
            _context.Posts.RemoveRange(posts);
            
            var comments = _context.Comments.Where(c => c.UserId == userId);
            _context.Comments.RemoveRange(comments);
            
            var reactions = _context.Reactions.Where(r => r.UserId == userId);
            _context.Reactions.RemoveRange(reactions);
            
            var matches = _context.Matches.Where(m => m.User1Id == userId || m.User2Id == userId);
            _context.Matches.RemoveRange(matches);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }

        [HttpPut("ban/{userId}")]
        public async Task<IActionResult> BanUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.IsBanned = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User banned successfully" });
        }

        [HttpPut("unban/{userId}")]
        public async Task<IActionResult> UnbanUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.IsBanned = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User unbanned successfully" });
        }

        [HttpPut("make-admin/{userId}")]
        public async Task<IActionResult> MakeAdmin(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.Role = "Admin";
            await _context.SaveChangesAsync();

            return Ok(new { message = "User is now an admin" });
        }

        [HttpPut("remove-admin/{userId}")]
        public async Task<IActionResult> RemoveAdmin(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.Role = "User";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Admin role removed" });
        }

        [HttpDelete("post/{postId}")]
        public async Task<IActionResult> DeleteAnyPost(int postId)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return NotFound();

            var comments = _context.Comments.Where(c => c.PostId == postId);
            _context.Comments.RemoveRange(comments);
            
            var reactions = _context.Reactions.Where(r => r.PostId == postId);
            _context.Reactions.RemoveRange(reactions);
            
            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Post deleted by admin" });
        }
    }
}