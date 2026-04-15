using System.Collections.Generic;

namespace Backend.Models
{
    public class Post
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public User? User { get; set; }
        public ICollection<Reaction>? Reactions { get; set; }  
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        
    }
}