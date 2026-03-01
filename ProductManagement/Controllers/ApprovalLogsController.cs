using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApprovalLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ApprovalLogsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static string GetActionText(int action) => action switch
        {
            2 => "Approved",
            4 => "Rejected",
            _ => "Unknown"
        };

        // GET: api/approvallogs
        [HttpGet]
        [Authorize(Roles = "Admin,Approver,Reviewer")]
        public async Task<IActionResult> GetAll()
        {
            var logs = await _context.ApprovalLogs
                .Include(al => al.PurchaseRequest)
                .Include(al => al.Approver)
                .OrderByDescending(al => al.LogTime)
                .Select(al => new ApprovalLogDto
                {
                    Id = al.Id,
                    RequestId = al.RequestId,
                    RequestTitle = al.PurchaseRequest.Title,
                    ApproverId = al.ApproverId,
                    ApproverName = al.Approver.Username,
                    Action = al.Action,
                    ActionText = al.Action == 2 ? "Approved" : al.Action == 4 ? "Rejected" : "Unknown",
                    ApproverComment = al.ApproverComment,
                    LogTime = al.LogTime
                })
                .ToListAsync();

            return Ok(logs);
        }

        // GET: api/approvallogs/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var log = await _context.ApprovalLogs
                .Include(al => al.PurchaseRequest)
                .Include(al => al.Approver)
                .FirstOrDefaultAsync(al => al.Id == id);

            if (log == null)
                return NotFound(new { message = "Approval log not found." });

            return Ok(new ApprovalLogDto
            {
                Id = log.Id,
                RequestId = log.RequestId,
                RequestTitle = log.PurchaseRequest.Title,
                ApproverId = log.ApproverId,
                ApproverName = log.Approver.Username,
                Action = log.Action,
                ActionText = GetActionText(log.Action),
                ApproverComment = log.ApproverComment,
                LogTime = log.LogTime
            });
        }

        // GET: api/approvallogs/request/{requestId}
        [HttpGet("request/{requestId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByRequestId(Guid requestId)
        {
            var logs = await _context.ApprovalLogs
                .Include(al => al.PurchaseRequest)
                .Include(al => al.Approver)
                .Where(al => al.RequestId == requestId)
                .OrderByDescending(al => al.LogTime)
                .Select(al => new ApprovalLogDto
                {
                    Id = al.Id,
                    RequestId = al.RequestId,
                    RequestTitle = al.PurchaseRequest.Title,
                    ApproverId = al.ApproverId,
                    ApproverName = al.Approver.Username,
                    Action = al.Action,
                    ActionText = al.Action == 2 ? "Approved" : al.Action == 4 ? "Rejected" : "Unknown",
                    ApproverComment = al.ApproverComment,
                    LogTime = al.LogTime
                })
                .ToListAsync();

            return Ok(logs);
        }

        // DELETE: api/approvallogs/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var log = await _context.ApprovalLogs.FindAsync(id);
            if (log == null)
                return NotFound(new { message = "Approval log not found." });

            _context.ApprovalLogs.Remove(log);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Approval log deleted successfully." });
        }
    }
}
