namespace Backend.Models
{
    public class Match
    {
        public int Id { get; set; }
        public int User1Id { get; set; }
        public int User2Id { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public User? User1 { get; set; }
        public User? User2 { get; set; }
    }
}