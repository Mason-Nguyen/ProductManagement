using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;
using ProductManagement.Exceptions;
using ProductManagement.Models;

namespace ProductManagement.Services
{
    public class PurchaseRequestCommandService : IPurchaseRequestCommandService
    {
        private readonly ApplicationDbContext _context;

        public PurchaseRequestCommandService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PurchaseRequestDto> SubmitAsync(Guid id, Guid userId)
        {
            // Find request and verify ownership
            var request = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstOrDefaultAsync(pr => pr.Id == id && pr.CreatedUserId == userId);

            if (request == null)
                throw new NotFoundException("Purchase request not found or you don't have permission to submit it.");

            // Validate status
            if (request.Status != 0)
                throw new InvalidOperationException("Only draft requests can be submitted.");

            // Update status to Waiting for Review
            request.Status = 1;
            request.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Map to DTO
            return MapToDto(request);
        }

        private PurchaseRequestDto MapToDto(PurchaseRequest pr)
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

        private static string GetStatusText(int status) => status switch
        {
            0 => "Draft",
            1 => "Waiting for Review",
            2 => "Approved",
            3 => "Cancelled",
            4 => "Rejected",
            _ => "Unknown"
        };

        public async Task<PurchaseRequestDto> ApproveAsync(Guid id, Guid userId, string userRole, string reviewerComment)
        {
            if (string.IsNullOrWhiteSpace(reviewerComment))
                throw new ArgumentException("ReviewerComment is required to approve.");

            var request = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstOrDefaultAsync(pr => pr.Id == id && pr.Status == 1);

            if (request == null)
                throw new NotFoundException("Purchase request not found or not in pending status.");
            // Price-based approval rule using ApprovalConfig
            var approvalConfigs = await _context.ApprovalConfigs.ToListAsync();

            if (approvalConfigs.Any())
            {
                // Get the current user's RoleId
                var currentUser = await _context.Users.FindAsync(userId);
                if (currentUser == null)
                    throw new NotFoundException("Current user not found.");

                // Check if there's a config matching the user's roleId AND the request's totalPrice is in range
                var matchingConfig = approvalConfigs.FirstOrDefault(ac =>
                    ac.RoleId == currentUser.RoleId &&
                    request.TotalPrice >= ac.MinAmount &&
                    request.TotalPrice <= ac.MaxAmount);

                if (matchingConfig == null)
                    throw new InvalidOperationException("You do not have permission to approve requests in this amount range.");
            }
            else
            {
                // Fallback: no configs in DB, use legacy 5M rule
                if (request.TotalPrice >= 5000000m && userRole != "Approver")
                    throw new InvalidOperationException("Only Approver can approve requests with total price >= 5,000,000.");
            }

            request.Status = 2; // Approved
            request.ReviewerComment = reviewerComment;
            request.ReviewerId = userId;
            request.ApproverId = userId;
            request.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Create ApprovalLog
            _context.ApprovalLogs.Add(new ApprovalLog
            {
                Id = Guid.NewGuid(),
                RequestId = id,
                ApproverId = userId,
                Action = 2, // Approved
                ApproverComment = reviewerComment,
                LogTime = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Reload with includes
            var updated = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstAsync(pr => pr.Id == id);

            return MapToDto(updated);
        }

        public async Task<PurchaseRequestDto> RejectAsync(Guid id, Guid userId, string reviewerComment)
        {
            if (string.IsNullOrWhiteSpace(reviewerComment))
                throw new ArgumentException("ReviewerComment is required to reject.");

            var request = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstOrDefaultAsync(pr => pr.Id == id && pr.Status == 1);

            if (request == null)
                throw new NotFoundException("Purchase request not found or not in pending status.");

            request.Status = 4; // Rejected
            request.ReviewerComment = reviewerComment;
            request.ReviewerId = userId;
            request.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Create ApprovalLog
            _context.ApprovalLogs.Add(new ApprovalLog
            {
                Id = Guid.NewGuid(),
                RequestId = id,
                ApproverId = userId,
                Action = 4, // Rejected
                ApproverComment = reviewerComment,
                LogTime = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Reload with includes
            var updated = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstAsync(pr => pr.Id == id);

            return MapToDto(updated);
        }

        public async Task<PurchaseRequestDto> UpdateCommentAsync(Guid id, Guid userId, string reviewerComment)
        {
            if (string.IsNullOrWhiteSpace(reviewerComment))
                throw new ArgumentException("ReviewerComment cannot be empty.");

            var request = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstOrDefaultAsync(pr => pr.Id == id && pr.Status == 1);

            if (request == null)
                throw new NotFoundException("Purchase request not found or not in pending status.");

            request.ReviewerComment = reviewerComment;
            request.ReviewerId = userId;
            request.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload with includes
            var updated = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstAsync(pr => pr.Id == id);

            return MapToDto(updated);
        }
    }
}
