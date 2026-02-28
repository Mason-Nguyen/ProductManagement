using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;
using ProductManagement.Models;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .OrderByDescending(u => u.CreatedDate)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Phone = u.Phone,
                    CreatedDate = u.CreatedDate,
                    Status = u.Status,
                    RoleId = u.RoleId,
                    RoleName = u.Role.RoleName,
                    DepartmentId = u.DepartmentId,
                    DepartmentName = u.Department != null ? u.Department.Name : null
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "User not found." });

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Phone = user.Phone,
                CreatedDate = user.CreatedDate,
                Status = user.Status,
                RoleId = user.RoleId,
                RoleName = user.Role.RoleName,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department != null ? user.Department.Name : null
            });
        }

        // POST: api/users
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                return BadRequest(new { message = "Username already exists." });

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email already exists." });

            var role = await _context.Roles.FindAsync(request.RoleId);
            if (role == null)
                return BadRequest(new { message = "Invalid role." });

            // Validate department if provided
            if (request.DepartmentId.HasValue)
            {
                var department = await _context.Departments.FindAsync(request.DepartmentId.Value);
                if (department == null)
                    return BadRequest(new { message = "Invalid department." });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = request.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Phone = request.Phone,
                CreatedDate = DateTime.UtcNow,
                Status = true,
                RoleId = request.RoleId,
                DepartmentId = request.DepartmentId
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Reload with Department for response
            await _context.Entry(user).Reference(u => u.Department).LoadAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Phone = user.Phone,
                CreatedDate = user.CreatedDate,
                Status = user.Status,
                RoleId = user.RoleId,
                RoleName = role.RoleName,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department != null ? user.Department.Name : null
            });
        }

        // PUT: api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == id);
            
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Check username uniqueness (excluding current user)
            if (await _context.Users.AnyAsync(u => u.Username == request.Username && u.Id != id))
                return BadRequest(new { message = "Username already exists." });

            // Check email uniqueness (excluding current user)
            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
                return BadRequest(new { message = "Email already exists." });

            var role = await _context.Roles.FindAsync(request.RoleId);
            if (role == null)
                return BadRequest(new { message = "Invalid role." });

            // Validate department if provided
            if (request.DepartmentId.HasValue)
            {
                var department = await _context.Departments.FindAsync(request.DepartmentId.Value);
                if (department == null)
                    return BadRequest(new { message = "Invalid department." });
            }

            user.Username = request.Username;
            user.Email = request.Email;
            user.Phone = request.Phone;
            user.RoleId = request.RoleId;
            user.Status = request.Status;
            user.DepartmentId = request.DepartmentId;

            // Only update password if provided
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            await _context.SaveChangesAsync();

            // Reload Department for response
            await _context.Entry(user).Reference(u => u.Department).LoadAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Phone = user.Phone,
                CreatedDate = user.CreatedDate,
                Status = user.Status,
                RoleId = user.RoleId,
                RoleName = role.RoleName,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department != null ? user.Department.Name : null
            });
        }

        // DELETE: api/users/{id} — Soft delete (set Status = false)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found." });

            user.Status = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deactivated successfully." });
        }
    }
}
