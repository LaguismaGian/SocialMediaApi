using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Person> People { get; set; }
        public DbSet<Reaction> Reactions { get; set; }  
        public DbSet<Match> Matches { get; set; }
        public DbSet<Message> Messages { get; set; }    
        public DbSet<Comment> Comments { get; set; }
    }
}