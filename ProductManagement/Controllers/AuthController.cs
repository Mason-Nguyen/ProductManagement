using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProductManagement.Data;
using ProductManagement.DTOs;
using ProductManagement.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                return Unauthorized(new { message = "Invalid email or password." });

            if (!user.Status)
                return Unauthorized(new { message = "Account is disabled." });

            var token = GenerateJwtToken(user);

            // Create login log
            var loginLog = new LoginLog
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Action = 1, // Login
                ActionTime = DateTime.UtcNow,
                IpAddress = GetClientIpAddress()
            };
            _context.LoginLogs.Add(loginLog);
            await _context.SaveChangesAsync();

            return Ok(new LoginResponse
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role.RoleName
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if username exists
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                return BadRequest(new { message = "Username already exists." });

            // Check if email exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email already exists." });

            // Check if role exists
            var role = await _context.Roles.FindAsync(request.RoleId);
            if (role == null)
                return BadRequest(new { message = "Invalid role." });

            var user = new Models.User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = request.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Phone = request.Phone,
                CreatedDate = DateTime.UtcNow,
                Status = true,
                RoleId = request.RoleId
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully." });
        }

        private string GenerateJwtToken(Models.User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.RoleName)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpireMinutes"]!)),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GetClientIpAddress()
        {
            // Check X-Forwarded-For header first (for reverse proxy scenarios)
            var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                // Take the first IP if there are multiple
                return forwardedFor.Split(',')[0].Trim();
            }

            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Invalid token." });

            var loginLog = new LoginLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = 2, // Logout
                ActionTime = DateTime.UtcNow,
                IpAddress = GetClientIpAddress()
            };
            _context.LoginLogs.Add(loginLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Logged out successfully." });
        }
    }
}
