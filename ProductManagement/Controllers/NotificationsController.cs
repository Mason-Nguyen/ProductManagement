using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Reviewer,Approver")]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/notifications/pending-count
        [HttpGet("pending-count")]
        public async Task<IActionResult> GetPendingCount()
        {
            // Get all pending requests (Status = 1, ReviewerId = null, ApproverId = null)
            var pendingRequests = await _context.PurchaseRequests
                .Where(pr => pr.Status == 1 
                    && pr.ReviewerId == null 
                    && pr.ApproverId == null)
                .ToListAsync();

            var normalCount = pendingRequests.Count(pr => pr.Urgent == 0);
            var urgentCount = pendingRequests.Count(pr => pr.Urgent == 1);

            return Ok(new NotificationCountDto 
            { 
                NormalCount = normalCount, 
                UrgentCount = urgentCount 
            });
        }
    }
}
