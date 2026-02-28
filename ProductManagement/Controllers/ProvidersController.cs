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
    public class ProvidersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProvidersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/providers
        [HttpGet]
        [Authorize(Roles = "Admin,Approver,Reviewer,Requester,Receiver")]
        public async Task<IActionResult> GetAll()
        {
            var providers = await _context.Providers
                .OrderBy(p => p.ProviderName)
                .Select(p => new ProviderDto
                {
                    Id = p.Id,
                    ProviderName = p.ProviderName,
                    TaxIdentification = p.TaxIdentification,
                    Address = p.Address,
                    ContactPerson = p.ContactPerson,
                    PhoneNumber = p.PhoneNumber
                })
                .ToListAsync();

            return Ok(providers);
        }

        // GET: api/providers/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Approver,Reviewer,Requester,Receiver")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var provider = await _context.Providers.FindAsync(id);

            if (provider == null)
                return NotFound(new { message = "Provider not found." });

            return Ok(new ProviderDto
            {
                Id = provider.Id,
                ProviderName = provider.ProviderName,
                TaxIdentification = provider.TaxIdentification,
                Address = provider.Address,
                ContactPerson = provider.ContactPerson,
                PhoneNumber = provider.PhoneNumber
            });
        }

        // POST: api/providers
        [HttpPost]
        [Authorize(Roles = "Admin,Reviewer")]
        public async Task<IActionResult> Create([FromBody] CreateProviderRequest request)
        {
            if (await _context.Providers.AnyAsync(p => p.TaxIdentification == request.TaxIdentification))
                return BadRequest(new { message = "A provider with this Tax Identification already exists." });

            var provider = new Provider
            {
                Id = Guid.NewGuid(),
                ProviderName = request.ProviderName,
                TaxIdentification = request.TaxIdentification,
                Address = request.Address,
                ContactPerson = request.ContactPerson,
                PhoneNumber = request.PhoneNumber
            };

            _context.Providers.Add(provider);
            await _context.SaveChangesAsync();

            return Ok(new ProviderDto
            {
                Id = provider.Id,
                ProviderName = provider.ProviderName,
                TaxIdentification = provider.TaxIdentification,
                Address = provider.Address,
                ContactPerson = provider.ContactPerson,
                PhoneNumber = provider.PhoneNumber
            });
        }

        // PUT: api/providers/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Reviewer")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProviderRequest request)
        {
            var provider = await _context.Providers.FindAsync(id);
            if (provider == null)
                return NotFound(new { message = "Provider not found." });

            // Check tax identification uniqueness (excluding current provider)
            if (await _context.Providers.AnyAsync(p => p.TaxIdentification == request.TaxIdentification && p.Id != id))
                return BadRequest(new { message = "A provider with this Tax Identification already exists." });

            provider.ProviderName = request.ProviderName;
            provider.TaxIdentification = request.TaxIdentification;
            provider.Address = request.Address;
            provider.ContactPerson = request.ContactPerson;
            provider.PhoneNumber = request.PhoneNumber;

            await _context.SaveChangesAsync();

            return Ok(new ProviderDto
            {
                Id = provider.Id,
                ProviderName = provider.ProviderName,
                TaxIdentification = provider.TaxIdentification,
                Address = provider.Address,
                ContactPerson = provider.ContactPerson,
                PhoneNumber = provider.PhoneNumber
            });
        }

        // No DELETE endpoint — providers cannot be deleted
    }
}
