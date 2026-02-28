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
    public class ApprovalConfigsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ApprovalConfigsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/approvalconfigs
        [HttpGet]
        [Authorize(Roles = "Admin,Reviewer,Approver")]
        public async Task<IActionResult> GetAll()
        {
            var configs = await _context.ApprovalConfigs
                .Include(ac => ac.Role)
                .OrderBy(ac => ac.MinAmount)
                .Select(ac => new ApprovalConfigDto
                {
                    Id = ac.Id,
                    RoleId = ac.RoleId,
                    RoleName = ac.Role.RoleName,
                    MinAmount = ac.MinAmount,
                    MaxAmount = ac.MaxAmount
                })
                .ToListAsync();

            return Ok(configs);
        }

        // GET: api/approvalconfigs/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var config = await _context.ApprovalConfigs
                .Include(ac => ac.Role)
                .FirstOrDefaultAsync(ac => ac.Id == id);

            if (config == null)
                return NotFound(new { message = "Approval config not found." });

            return Ok(new ApprovalConfigDto
            {
                Id = config.Id,
                RoleId = config.RoleId,
                RoleName = config.Role.RoleName,
                MinAmount = config.MinAmount,
                MaxAmount = config.MaxAmount
            });
        }

        // POST: api/approvalconfigs
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateApprovalConfigRequest request)
        {
            // Validate MinAmount <= MaxAmount
            if (request.MinAmount > request.MaxAmount)
                return BadRequest(new { message = "Min Amount must be less than or equal to Max Amount." });

            // Validate RoleId exists
            var role = await _context.Roles.FindAsync(request.RoleId);
            if (role == null)
                return BadRequest(new { message = "Role not found." });

            // Validate unique RoleId (one config per role)
            var duplicateRole = await _context.ApprovalConfigs
                .AnyAsync(ac => ac.RoleId == request.RoleId);
            if (duplicateRole)
                return BadRequest(new { message = "A configuration for this role already exists." });

            // Validate no overlapping amount ranges
            var overlapping = await _context.ApprovalConfigs
                .AnyAsync(ac => request.MinAmount <= ac.MaxAmount && request.MaxAmount >= ac.MinAmount);
            if (overlapping)
                return BadRequest(new { message = "The amount range overlaps with an existing configuration." });

            var config = new ApprovalConfig
            {
                Id = Guid.NewGuid(),
                RoleId = request.RoleId,
                MinAmount = request.MinAmount,
                MaxAmount = request.MaxAmount
            };

            _context.ApprovalConfigs.Add(config);
            await _context.SaveChangesAsync();

            return Ok(new ApprovalConfigDto
            {
                Id = config.Id,
                RoleId = config.RoleId,
                RoleName = role.RoleName,
                MinAmount = config.MinAmount,
                MaxAmount = config.MaxAmount
            });
        }

        // PUT: api/approvalconfigs/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateApprovalConfigRequest request)
        {
            var config = await _context.ApprovalConfigs.FindAsync(id);
            if (config == null)
                return NotFound(new { message = "Approval config not found." });

            // Validate MinAmount <= MaxAmount
            if (request.MinAmount > request.MaxAmount)
                return BadRequest(new { message = "Min Amount must be less than or equal to Max Amount." });

            // Validate RoleId exists
            var role = await _context.Roles.FindAsync(request.RoleId);
            if (role == null)
                return BadRequest(new { message = "Role not found." });

            // Validate unique RoleId (exclude self)
            var duplicateRole = await _context.ApprovalConfigs
                .AnyAsync(ac => ac.RoleId == request.RoleId && ac.Id != id);
            if (duplicateRole)
                return BadRequest(new { message = "A configuration for this role already exists." });

            // Validate no overlapping amount ranges (exclude self)
            var overlapping = await _context.ApprovalConfigs
                .AnyAsync(ac => ac.Id != id && request.MinAmount <= ac.MaxAmount && request.MaxAmount >= ac.MinAmount);
            if (overlapping)
                return BadRequest(new { message = "The amount range overlaps with an existing configuration." });

            config.RoleId = request.RoleId;
            config.MinAmount = request.MinAmount;
            config.MaxAmount = request.MaxAmount;

            await _context.SaveChangesAsync();

            return Ok(new ApprovalConfigDto
            {
                Id = config.Id,
                RoleId = config.RoleId,
                RoleName = role.RoleName,
                MinAmount = config.MinAmount,
                MaxAmount = config.MaxAmount
            });
        }

        // DELETE: api/approvalconfigs/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var config = await _context.ApprovalConfigs.FindAsync(id);
            if (config == null)
                return NotFound(new { message = "Approval config not found." });

            _context.ApprovalConfigs.Remove(config);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Approval config deleted successfully." });
        }
    }
}
