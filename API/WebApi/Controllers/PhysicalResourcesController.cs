using Microsoft.AspNetCore.Mvc;
using Application.Services;
using Application.DTO;
using Domain.IRepository;
using Domain.Model.Resources;
using Domain.Model;
using System.Linq;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/PhysicalResources")]
    public class PhysicalResourcesController : ControllerBase
    {
        private readonly PhysicalResourceService _service;
        private readonly IQualificationRepository _qualificationRepository;
        private readonly List<string> _errorMessages = new();

        public PhysicalResourcesController(PhysicalResourceService service, IQualificationRepository qualificationRepository)
        {
            _service = service;
            _qualificationRepository = qualificationRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetAll()
        {
            var list = await _service.GetAll();
            if (list == null || !list.Any()) return NotFound("No physical resources found.");
            return Ok(list);
        }

        [HttpGet("ByCode/{code}")]
        public async Task<ActionResult<PhysicalResourceDTO>> GetByCode(string code)
        {
            var dto = await _service.GetByCode(code);
            if (dto == null) return NotFound($"Physical resource with code '{code}' not found.");
            return Ok(dto);
        }

        [HttpGet("ByDescription/{description}")]
        public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetByDescription(string description)
        {
            var result = await _service.GetByDescription(description);
            if (result == null || !result.Any()) return NotFound($"No physical resources found with description containing '{description}'.");
            return Ok(result);
        }



        [HttpGet("ByKind/{kind}")]
        public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetByKind(PhysicalResourceKind kind)
        {
            var result = await _service.GetByKind(kind);
            if (result == null) return NotFound($"No physical resources found with kind '{kind}'.");
            return Ok(result);
        }

        [HttpGet("ByStatus/{status}")]
        public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetByStatus(ResourceStatus status)
        {
            var result = await _service.GetByStatus(status);
            if (result == null) return NotFound($"No physical resources found with status '{status}'.");
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<PhysicalResourceDTO>> Post(PhysicalResourceDTO dto)
        {
            _errorMessages.Clear();
            if (dto == null) return BadRequest("Resource data is null.");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var created = await _service.Add(dto, _errorMessages);
            if (created == null)
            {
                if (_errorMessages.Any(msg => msg.Contains("already exists", StringComparison.OrdinalIgnoreCase))) return Conflict(_errorMessages);
                return BadRequest(_errorMessages);
            }
            return CreatedAtAction(nameof(GetByCode), new { code = created.Code }, created);
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> Put(long id, PhysicalResourceDTO dto)
        {
            _errorMessages.Clear();
            if (dto == null) return BadRequest("Resource data must be provided.");
            if (!ModelState.IsValid) return BadRequest(ModelState);


            var existing = await _service.GetById(id);
            if (existing != null && !string.Equals(existing.Code, dto.Code, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Resource code cannot be changed.");
            }

            bool updated = await _service.Update(id, dto, _errorMessages);
            if (!updated)
            {
                if (_errorMessages.Any(msg => msg.Contains("already exists", StringComparison.OrdinalIgnoreCase))) return Conflict(_errorMessages);
                return BadRequest(_errorMessages);
            }
            return Ok();
        }
    }
}
