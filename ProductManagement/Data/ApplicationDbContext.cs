using Microsoft.EntityFrameworkCore;
using ProductManagement.Models;

namespace ProductManagement.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Provider> Providers { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<PurchaseRequest> PurchaseRequests { get; set; }
        public DbSet<PurchaseProduct> PurchaseProducts { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseProductOrder> PurchaseProductOrders { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Role Id as GUID v4
            modelBuilder.Entity<Role>()
                .Property(r => r.Id)
                .HasDefaultValueSql("NEWID()");

            // Configure User Id as GUID v4
            modelBuilder.Entity<User>()
                .Property(u => u.Id)
                .HasDefaultValueSql("NEWID()");

            // Configure Provider Id as GUID v4
            modelBuilder.Entity<Provider>()
                .Property(p => p.Id)
                .HasDefaultValueSql("NEWID()");

            // Configure Product Id as GUID v4
            modelBuilder.Entity<Product>()
                .Property(p => p.Id)
                .HasDefaultValueSql("NEWID()");

            // Configure Department Id as GUID v4
            modelBuilder.Entity<Department>()
                .Property(d => d.Id)
                .HasDefaultValueSql("NEWID()");

            // Unique constraint on Department Name
            modelBuilder.Entity<Department>()
                .HasIndex(d => d.Name)
                .IsUnique();

            // Configure Product -> Provider relationship
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Provider)
                .WithMany()
                .HasForeignKey(p => p.ProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseRequest Id as GUID v4
            modelBuilder.Entity<PurchaseRequest>()
                .Property(pr => pr.Id)
                .HasDefaultValueSql("NEWID()");

            // Configure PurchaseRequest -> User (Reviewer) relationship (optional)
            modelBuilder.Entity<PurchaseRequest>()
                .HasOne(pr => pr.Reviewer)
                .WithMany()
                .HasForeignKey(pr => pr.ReviewerId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseRequest -> User (Approver) relationship (optional)
            modelBuilder.Entity<PurchaseRequest>()
                .HasOne(pr => pr.Approver)
                .WithMany()
                .HasForeignKey(pr => pr.ApproverId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseRequest -> User (CreatedUser) relationship
            modelBuilder.Entity<PurchaseRequest>()
                .HasOne(pr => pr.CreatedUser)
                .WithMany()
                .HasForeignKey(pr => pr.CreatedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseProduct Id as GUID v4
            modelBuilder.Entity<PurchaseProduct>()
                .Property(pp => pp.Id)
                .HasDefaultValueSql("NEWID()");

            // Configure PurchaseProduct -> PurchaseRequest relationship
            modelBuilder.Entity<PurchaseProduct>()
                .HasOne(pp => pp.PurchaseRequest)
                .WithMany()
                .HasForeignKey(pp => pp.RequestId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseProduct -> Product relationship
            modelBuilder.Entity<PurchaseProduct>()
                .HasOne(pp => pp.Product)
                .WithMany()
                .HasForeignKey(pp => pp.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseOrder Id as GUID v4
            modelBuilder.Entity<PurchaseOrder>()
                .Property(po => po.Id)
                .HasDefaultValueSql("NEWID()");

            // Configure PurchaseOrder TotalPrice precision
            modelBuilder.Entity<PurchaseOrder>()
                .Property(po => po.TotalPrice)
                .HasPrecision(18, 3);

            // Configure PurchaseOrder -> Reviewer relationship
            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(po => po.Reviewer)
                .WithMany()
                .HasForeignKey(po => po.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseOrder -> Approver relationship
            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(po => po.Approver)
                .WithMany()
                .HasForeignKey(po => po.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseOrder -> CreatedUser relationship
            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(po => po.CreatedUser)
                .WithMany()
                .HasForeignKey(po => po.CreatedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseOrder -> PurchaseRequest relationship
            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(po => po.PurchaseRequest)
                .WithMany()
                .HasForeignKey(po => po.PurchaseRequestId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseProductOrder Id as GUID v4
            modelBuilder.Entity<PurchaseProductOrder>()
                .Property(ppo => ppo.Id)
                .HasDefaultValueSql("NEWID()");

            // Configure PurchaseProductOrder -> Product relationship
            modelBuilder.Entity<PurchaseProductOrder>()
                .HasOne(ppo => ppo.Product)
                .WithMany()
                .HasForeignKey(ppo => ppo.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseProductOrder -> PurchaseOrder relationship
            modelBuilder.Entity<PurchaseProductOrder>()
                .HasOne(ppo => ppo.PurchaseOrder)
                .WithMany()
                .HasForeignKey(ppo => ppo.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PurchaseProductOrder -> CheckedUser relationship (optional)
            modelBuilder.Entity<PurchaseProductOrder>()
                .HasOne(ppo => ppo.CheckedUser)
                .WithMany()
                .HasForeignKey(ppo => ppo.CheckedUserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure User -> Role relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure User -> Department relationship (optional)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Department)
                .WithMany()
                .HasForeignKey(u => u.DepartmentId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint on Username
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Unique constraint on Email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Seed Roles (using GUID v4)
            var roles = new List<Role>
            {
                new Role { Id = Guid.Parse("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), RoleName = "Admin" },
                new Role { Id = Guid.Parse("b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"), RoleName = "Requester" },
                new Role { Id = Guid.Parse("c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f"), RoleName = "Reviewer" },
                new Role { Id = Guid.Parse("d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a"), RoleName = "Approver" },
                new Role { Id = Guid.Parse("e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b"), RoleName = "Receiver" },
                new Role { Id = Guid.Parse("f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c"), RoleName = "Purchaser" }
            };

            modelBuilder.Entity<Role>().HasData(roles);

            // Seed an Admin user (password: Admin@123)
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = Guid.Parse("a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d"),
                Email = "admin@productmanagement.com",
                Username = "admin",
                Password = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Phone = "0123456789",
                CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Status = true,
                RoleId = Guid.Parse("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")
            });
        }
    }
}
