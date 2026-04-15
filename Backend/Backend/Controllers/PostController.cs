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
        public class PostController : ControllerBase
        {
            private readonly AppDbContext _context;

            public PostController(AppDbContext context)
            {
                _context = context;
            }

            [HttpPost("create")]
            public async Task<IActionResult> CreatePost([FromBody] CreatePostRequest request)
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                    return Unauthorized();

                var post = new Post
                {
                    UserId = int.Parse(userId),
                    Content = request.Content,
                    ImageUrl = request.ImageUrl,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                return Ok(post);
            }

            [HttpGet("feed")]
            public async Task<IActionResult> GetFeed()
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userIdInt = userId != null ? int.Parse(userId) : 0;
            
                var posts = await _context.Posts
                    .Include(p => p.User)
                    .Include(p => p.Reactions)
                    .Include(p => p.Comments)
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new
                    {
                        p.Id,
                        p.Content,
                        p.ImageUrl,
                        p.CreatedAt,
                        User = new { p.User!.Id, p.User.Name, p.User.ProfilePhoto },
                        LikesCount = p.Reactions.Count(r => r.Type == "interested"),
                        UserLiked = p.Reactions.Any(r => r.UserId == userIdInt && r.Type == "interested"),
                        CommentsCount = p.Comments.Count
                    })
                    .ToListAsync();
            
                return Ok(posts);
            }

            [HttpPost("{postId}/interested")]
            public async Task<IActionResult> ToggleInterested(int postId)
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                    return Unauthorized();

                var userIdInt = int.Parse(userId);
                
                var post = await _context.Posts.FindAsync(postId);
                if (post == null)
                    return NotFound(new { message = "Post not found" });

                Console.WriteLine($"--- ToggleInterested called ---");
                Console.WriteLine($"Current user ID: {userIdInt}");
                Console.WriteLine($"Post author ID: {post.UserId}");
                Console.WriteLine($"Post ID: {postId}");

                var existing = await _context.Reactions
                    .FirstOrDefaultAsync(r => r.UserId == userIdInt && r.PostId == postId && r.Type == "interested");

                Console.WriteLine($"Existing reaction: {(existing != null ? "Yes" : "No")}");

                bool isMatch = false;

                if (existing != null)
                {
                    Console.WriteLine("REMOVING LIKE...");
                    
                    _context.Reactions.Remove(existing);
                    await _context.SaveChangesAsync();
                    Console.WriteLine("Reaction removed");
                    
                    // Delete match if it exists
                    var match = await _context.Matches
                        .FirstOrDefaultAsync(m => 
                            (m.User1Id == userIdInt && m.User2Id == post.UserId) ||
                            (m.User1Id == post.UserId && m.User2Id == userIdInt));
                    
                    Console.WriteLine($"Match found: {(match != null ? "Yes" : "No")}");
                    
                    if (match != null)
                    {
                        Console.WriteLine($"Deleting match with ID: {match.Id} between {match.User1Id} and {match.User2Id}");
                        _context.Matches.Remove(match);
                        await _context.SaveChangesAsync();
                        Console.WriteLine("Match deleted");
                    }
                }
                else
                {
                    Console.WriteLine("ADDING LIKE...");
                    
                    var reaction = new Reaction
                    {
                        UserId = userIdInt,
                        PostId = postId,
                        Type = "interested",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Reactions.Add(reaction);
                    await _context.SaveChangesAsync();
                    Console.WriteLine("Reaction added");

                    // Check if match already exists first
                    var existingMatch = await _context.Matches
                        .FirstOrDefaultAsync(m => 
                            (m.User1Id == userIdInt && m.User2Id == post.UserId) ||
                            (m.User1Id == post.UserId && m.User2Id == userIdInt));

                    Console.WriteLine($"Existing match: {(existingMatch != null ? "Yes" : "No")}");

                    if (existingMatch != null)
                    {
                        isMatch = false;
                        Console.WriteLine("Match already exists - no new match created");
                    }
                    else
                    {
                        // Check for mutual like
                        var mutualLike = await _context.Reactions
                            .Include(r => r.Post)
                            .AnyAsync(r => r.UserId == post.UserId && r.Post!.UserId == userIdInt && r.Type == "interested");

                        Console.WriteLine($"Mutual like found: {mutualLike}");

                        if (mutualLike && post.UserId != userIdInt)
                        {
                            var match = new Match
                            {
                                User1Id = userIdInt,
                                User2Id = post.UserId,
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.Matches.Add(match);
                            await _context.SaveChangesAsync();
                            Console.WriteLine($"Created new match between {userIdInt} and {post.UserId}");
                            isMatch = true;
                        }
                    }
                }

                Console.WriteLine($"Returning: liked={existing == null}, isMatch={isMatch}");
                Console.WriteLine($"--- End ---");
                
                return Ok(new { liked = existing == null, isMatch });
            }

            [HttpGet("matches")]
            public async Task<IActionResult> GetMatches()
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                    return Unauthorized();
            
                var userIdInt = int.Parse(userId);
            
                var matches = await _context.Matches
                    .Where(m => m.User1Id == userIdInt || m.User2Id == userIdInt)
                    .Include(m => m.User1)
                    .Include(m => m.User2)
                    .Select(m => new
                    {
                        Id = m.Id,
                        MatchedUser = m.User1Id == userIdInt 
                            ? new { m.User2!.Id, m.User2.Name, m.User2.ProfilePhoto } 
                            : new { m.User1!.Id, m.User1.Name, m.User1.ProfilePhoto },
                        CreatedAt = m.CreatedAt
                    })
                    .Distinct()
                    .ToListAsync();
            
                return Ok(matches);
            }

            [HttpGet("check-matches")]
            public async Task<IActionResult> CheckMatches()
            {
                var allMatches = await _context.Matches.ToListAsync();
                return Ok(allMatches);
            }

            [HttpDelete("{postId}")]
            public async Task<IActionResult> DeletePost(int postId)
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                    return Unauthorized();

                var post = await _context.Posts.FindAsync(postId);
                if (post == null)
                    return NotFound(new { message = "Post not found" });
            
                // Check if user owns the post
                if (post.UserId != int.Parse(userId))
                    return Forbid();

                // Delete associated reactions first
                var reactions = _context.Reactions.Where(r => r.PostId == postId);
                _context.Reactions.RemoveRange(reactions);

                // Delete the post
                _context.Posts.Remove(post);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Post deleted" });
            }

            [HttpPut("{postId}")]
            public async Task<IActionResult> UpdatePost(int postId, [FromBody] UpdatePostRequest request)
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                    return Unauthorized();
            
                var post = await _context.Posts.FindAsync(postId);
                if (post == null)
                    return NotFound(new { message = "Post not found" });
            
                // Check if user owns the post
                if (post.UserId != int.Parse(userId))
                    return Forbid();
            
                // Update content
                if (!string.IsNullOrEmpty(request.Content))
                    post.Content = request.Content;
            
                // Update image (optional)
                if (request.ImageUrl != null)
                    post.ImageUrl = request.ImageUrl;
            
                await _context.SaveChangesAsync();
            
                return Ok(new { post.Id, post.Content, post.ImageUrl });
            }
            
            public class UpdatePostRequest
            {
                public string? Content { get; set; }
                public string? ImageUrl { get; set; }
            }
        }

        public class CreatePostRequest
        {
            public string Content { get; set; } = string.Empty;
            public string? ImageUrl { get; set; }
        }
    }