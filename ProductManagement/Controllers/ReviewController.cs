using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;
using ProductManagement.Services;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Reviewer,Approver")]
    public class ReviewController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPurchaseRequestCommandService _commandService;

        public ReviewController(ApplicationDbContext context, IPurchaseRequestCommandService commandService)
        {
            _context = context;
            _commandService = commandService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim!);
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }

        private static string GetStatusText(int status) => status switch
        {
            0 => "Draft",
            1 => "Waiting for Review",
            2 => "Approved",
            3 => "Cancelled",
            4 => "Rejected",
            _ => "Unknown"
        };

        private PurchaseRequestDto MapToDto(Models.PurchaseRequest pr)
        {
            return new PurchaseRequestDto
            {
                Id = pr.Id,
                Title = pr.Title,
                Description = pr.Description,
                Urgent = pr.Urgent,
                Status = pr.Status,
                StatusText = GetStatusText(pr.Status),
                ReviewerId = pr.ReviewerId,
                ReviewerName = pr.Reviewer?.Username,
                ApproverId = pr.ApproverId,
                ApproverName = pr.Approver?.Username,
                CreatedUserId = pr.CreatedUserId,
                CreatedUserName = pr.CreatedUser?.Username ?? string.Empty,
                CreatedDate = pr.CreatedDate,
                ModifiedDate = pr.ModifiedDate,
                ReviewerComment = pr.ReviewerComment,
                TotalPrice = pr.TotalPrice,
                Products = _context.PurchaseProducts
                    .Include(pp => pp.Product)
                    .Where(pp => pp.RequestId == pr.Id)
                    .Select(pp => new PurchaseProductDto
                    {
                        Id = pp.Id,
                        ProductId = pp.ProductId,
                        ProductCode = pp.Product.ProductCode,
                        Category = pp.Product.Category,
                        Unit = pp.Product.Unit,
                        Price = pp.Product.Price,
                        QuantityRequest = pp.QuantityRequest,
                        LineTotal = pp.Product.Price * pp.QuantityRequest
                    })
                    .ToList()
            };
        }

        // GET: api/review/pending
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var requests = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .Where(pr => pr.Status == 1)
                .OrderByDescending(pr => pr.ModifiedDate)
                .ToListAsync();

            return Ok(requests.Select(MapToDto));
        }

        // GET: api/review/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var request = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstOrDefaultAsync(pr => pr.Id == id);

            if (request == null)
                return NotFound(new { message = "Purchase request not found." });

            return Ok(MapToDto(request));
        }

        // PUT: api/review/{id}/approve
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetCurrentUserId();
                var role = GetCurrentUserRole();
                var result = await _commandService.ApproveAsync(id, userId, role, dto.ReviewerComment);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/review/{id}/comment
        [HttpPut("{id}/comment")]
        public async Task<IActionResult> UpdateComment(Guid id, [FromBody] UpdateCommentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetCurrentUserId();
                var result = await _commandService.UpdateCommentAsync(id, userId, dto.ReviewerComment);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/review/{id}/reject
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetCurrentUserId();
                var result = await _commandService.RejectAsync(id, userId, dto.ReviewerComment);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // GET: api/review/approved
        [HttpGet("approved")]
        public async Task<IActionResult> GetApproved()
        {
            var requests = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .Where(pr => pr.Status == 2)
                .OrderByDescending(pr => pr.ModifiedDate)
                .ToListAsync();

            return Ok(requests.Select(MapToDto));
        }

        // GET: api/review/rejected
        [HttpGet("rejected")]
        public async Task<IActionResult> GetRejected()
        {
            var requests = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .Where(pr => pr.Status == 4)
                .OrderByDescending(pr => pr.ModifiedDate)
                .ToListAsync();

            return Ok(requests.Select(MapToDto));
        }
    }
}
