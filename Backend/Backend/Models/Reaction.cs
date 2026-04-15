namespace Backend.Models
{
    public class Reaction
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int PostId { get; set; }
        public string Type { get; set; } = "interested";
        public DateTime CreatedAt { get; set; }
        
        public User? User { get; set; }
        public Post? Post { get; set; }
    }
}