using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LoginLogsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static string GetActionText(int action) => action switch
        {
            1 => "Login",
            2 => "Logout",
            _ => "Unknown"
        };

        // GET: api/loginlogs
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRecent()
        {
            var logs = await _context.LoginLogs
                .Include(ll => ll.User)
                    .ThenInclude(u => u.Role)
                .OrderByDescending(ll => ll.ActionTime)
                .Take(10)
                .Select(ll => new LoginLogDto
                {
                    Id = ll.Id,
                    UserId = ll.UserId,
                    UserName = ll.User.Username,
                    RoleName = ll.User.Role.RoleName,
                    Action = ll.Action,
                    ActionText = ll.Action == 1 ? "Login" : ll.Action == 2 ? "Logout" : "Unknown",
                    ActionTime = ll.ActionTime,
                    IpAddress = ll.IpAddress
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
