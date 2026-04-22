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
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public UserController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("profile/{id}")]
        public async Task<IActionResult> GetProfile(int id)
        {
            var user = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new { u.Id, u.Name, u.Email, u.Bio, u.ProfilePhoto })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var user = await _context.Users.FindAsync(int.Parse(userId));
            if (user == null)
                return NotFound();

            if (!string.IsNullOrEmpty(request.Name))
                user.Name = request.Name;
            
            if (request.Bio != null)
                user.Bio = request.Bio;

            await _context.SaveChangesAsync();
            return Ok(new { user.Name, user.Bio, user.ProfilePhoto });
        }

        [HttpPost("upload-photo")]
        public async Task<IActionResult> UploadProfilePhoto(IFormFile photo)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            if (photo == null || photo.Length == 0)
                return BadRequest(new { message = "No photo uploaded" });

            var uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "profile-photos");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(photo.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            var user = await _context.Users.FindAsync(int.Parse(userId));
            if (user == null)
                return NotFound();

            var photoUrl = $"/profile-photos/{uniqueFileName}";
            user.ProfilePhoto = photoUrl;
            await _context.SaveChangesAsync();

            return Ok(new { url = photoUrl });
        }

        [HttpGet("{id}/posts")]
        public async Task<IActionResult> GetUserPosts(int id)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUserIdInt = currentUserId != null ? int.Parse(currentUserId) : 0;
        
            var posts = await _context.Posts
                .Where(p => p.UserId == id)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new 
                { 
                    p.Id, 
                    p.Content, 
                    p.ImageUrl, 
                    p.CreatedAt,
                    LikesCount = p.Reactions.Count(r => r.Type == "interested"),
                    UserLiked = p.Reactions.Any(r => r.UserId == currentUserIdInt && r.Type == "interested"),
                    CommentsCount = p.Comments.Count  // ADD THIS LINE
                })
                .ToListAsync();
        
            return Ok(posts);
        }
    }

    public class UpdateProfileRequest
    {
        public string? Name { get; set; }
        public string? Bio { get; set; }
    }
}