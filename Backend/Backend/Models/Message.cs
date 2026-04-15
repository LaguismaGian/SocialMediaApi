namespace Backend.Models
{
    public class Message
    {
        public int Id { get; set; }
        public int MatchId { get; set; }
        public int SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
        
        public Match? Match { get; set; }
        public User? Sender { get; set; }
    }
}