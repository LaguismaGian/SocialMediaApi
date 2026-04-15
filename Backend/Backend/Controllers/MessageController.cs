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
    public class MessageController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MessageController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
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
                    MatchId = m.Id,
                    OtherUser = m.User1Id == userIdInt ? new { m.User2!.Id, m.User2.Name, m.User2.ProfilePhoto } : new { m.User1!.Id, m.User1.Name, m.User1.ProfilePhoto },
                    LastMessage = _context.Messages
                        .Where(msg => msg.MatchId == m.Id)
                        .OrderByDescending(msg => msg.SentAt)
                        .Select(msg => new { msg.Content, msg.SentAt, msg.IsRead })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(matches);
        }

        [HttpGet("{matchId}")]
        public async Task<IActionResult> GetMessages(int matchId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var messages = await _context.Messages
                .Where(m => m.MatchId == matchId)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.SenderId,
                    m.Content,
                    m.SentAt,
                    m.IsRead
                })
                .ToListAsync();

            // Mark messages as read
            var unreadMessages = messages.Where(m => m.SenderId != int.Parse(userId) && !m.IsRead);
            foreach (var msg in unreadMessages)
            {
                var message = await _context.Messages.FindAsync(msg.Id);
                if (message != null)
                {
                    message.IsRead = true;
                }
            }
            await _context.SaveChangesAsync();

            return Ok(messages);
        }

        [HttpPost("{matchId}")]
        public async Task<IActionResult> SendMessage(int matchId, [FromBody] SendMessageRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var match = await _context.Matches.FindAsync(matchId);
            if (match == null)
                return NotFound(new { message = "Match not found" });

            var message = new Message
            {
                MatchId = matchId,
                SenderId = int.Parse(userId),
                Content = request.Content,
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message.Id,
                message.SenderId,
                message.Content,
                message.SentAt,
                message.IsRead
            });
        }
    }

    public class SendMessageRequest
    {
        public string Content { get; set; } = string.Empty;
    }
}