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
    public class DepartmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DepartmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/departments
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var departments = await _context.Departments
                .OrderBy(d => d.Name)
                .Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    Name = d.Name
                })
                .ToListAsync();

            return Ok(departments);
        }

        // GET: api/departments/{id}
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id)
        {
            var department = await _context.Departments.FindAsync(id);

            if (department == null)
                return NotFound(new { message = "Department not found." });

            return Ok(new DepartmentDto
            {
                Id = department.Id,
                Name = department.Name
            });
        }

        // POST: api/departments
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request)
        {
            // Check if department name already exists
            if (await _context.Departments.AnyAsync(d => d.Name == request.Name))
                return BadRequest(new { message = "A department with this name already exists." });

            var department = new Department
            {
                Id = Guid.NewGuid(),
                Name = request.Name
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return Ok(new DepartmentDto
            {
                Id = department.Id,
                Name = department.Name
            });
        }

        // PUT: api/departments/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDepartmentRequest request)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
                return NotFound(new { message = "Department not found." });

            // Check name uniqueness (excluding current department)
            if (await _context.Departments.AnyAsync(d => d.Name == request.Name && d.Id != id))
                return BadRequest(new { message = "A department with this name already exists." });

            department.Name = request.Name;
            await _context.SaveChangesAsync();

            return Ok(new DepartmentDto
            {
                Id = department.Id,
                Name = department.Name
            });
        }

        // DELETE: api/departments/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
                return NotFound(new { message = "Department not found." });

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Department deleted successfully." });
        }
    }
}
