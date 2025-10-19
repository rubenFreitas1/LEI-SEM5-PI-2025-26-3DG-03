using Microsoft.AspNetCore.Mvc;


namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;

[ApiController]
[Route("api/Representative")]

public class RepresentativeController : ControllerBase
{
    private readonly RepresentativeService _representativeService;

    List<string> _errorMessages = new List<string>();

    public RepresentativeController(RepresentativeService representativeService)
    {
        _representativeService = representativeService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RepresentativeDTO>>> GetAllRepresentatives()
    {
        IEnumerable<RepresentativeDTO> representatives = await _representativeService.GetRepresentativesAsync();
        return Ok(representatives);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<RepresentativeDTO>> GetRepresentativeById(long id)
    {
        RepresentativeDTO? representativeDTO = await _representativeService.GetRepresentativeById(id);
        if (representativeDTO == null)
        {
            return NotFound($"Representative with ID '{id}' not found.");
        }
        return Ok(representativeDTO);
    }

    [HttpGet("ByEmail/{email}")]
    public async Task<ActionResult<RepresentativeDTO>> GetRepresentativeByEmail(string email)
    {
        RepresentativeDTO? representative = await _representativeService.GetRepresentativeByEmail(email);
        if (representative == null)
        {
            return NotFound($"Representative with email '{email}' not found.");
        }
        return Ok(representative);
    }

    [HttpGet("ByPhoneNumber/{phoneNumber}")]
    public async Task<ActionResult<RepresentativeDTO>> GetRepresentativeByPhoneNumber(string phoneNumber)
    {
        RepresentativeDTO? representative = await _representativeService.GetRepresentativeByPhoneNumber(phoneNumber);
        if (representative == null)
        {
            return NotFound($"Representative with phone number '{phoneNumber}' not found.");
        }
        return Ok(representative);
    }

    [HttpGet("ByCitizenId/{CitizenId}")]
    public async Task<ActionResult<RepresentativeDTO>> GetRepresentativeByCitizenId(string citizenId)
    {
        RepresentativeDTO? representative = await _representativeService.GetRepresentativeByCitizenId(citizenId);
        if (representative == null)
        {
            return NotFound($"Representative with citizen ID '{citizenId}' not found.");
        }
        return Ok(representative);
    }

    [HttpGet("ByName/{name}")]
    public async Task<ActionResult<RepresentativeDTO>> GetRepresentativeByName(string name)
    {
        RepresentativeDTO? representative = await _representativeService.GetRepresentativeByName(name);
        if (representative == null)
        {
            return NotFound($"Representative with name '{name}' not found.");
        }
        return Ok(representative);
    }

    [HttpGet("ByOrganization/{organizationName}")]
    public async Task<ActionResult<RepresentativeDTO>> GetRepresentativeByOrganizationName(string organizationName)
    {
        RepresentativeDTO? representative = await _representativeService.GetRepresentativeByOrganizationName(organizationName);
        if (representative == null)
        {
            return NotFound($"Representative with organization name '{organizationName}' not found.");
        }
        return Ok(representative);
    }

    [HttpPut("Update/{id}")]
    public async Task<IActionResult> PutRepresentative(long id, RepresentativeDTO representativeDTO)
    {
        if (representativeDTO == null)
        {
            return BadRequest("Representative data is required.");
        }
        bool updateResult = await _representativeService.UpdateRepresentative(id, representativeDTO, _errorMessages);
        if (!updateResult && _errorMessages.Any())
        {
            if (_errorMessages.Any(msg =>
                msg.Contains("already exists", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("Already exists", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }

        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<RepresentativeDTO>> PostRepresentative(RepresentativeDTO representativeDTO)
    {
        if (representativeDTO == null)
        {
            return BadRequest("Representative data is required.");
        }

        RepresentativeDTO? createdRepresentative = await _representativeService.AddRepresentative(representativeDTO, _errorMessages);
        if (createdRepresentative == null && _errorMessages.Any())
        {
            if (_errorMessages.Any(e => e.Contains("already exists", StringComparison.OrdinalIgnoreCase) ))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetRepresentativeById), new { id = createdRepresentative!.Id }, createdRepresentative);
    }

    
}