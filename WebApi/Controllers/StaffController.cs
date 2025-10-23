using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.IRepository;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;
using System.Collections.Generic;
using System.Threading.Tasks;


[ApiController]
[Route("api/Staff")]
public class StaffController : ControllerBase
{
    private readonly StaffService _staffService;
    List<string> _errorMessages = new List<string>();

    public StaffController(StaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StaffDTO>>> GetAll()
    {
        var staffDTOs = await _staffService.GetAllStaff();
        if (staffDTOs == null || !staffDTOs.Any())
            return NotFound("No staff available.");
        return Ok(staffDTOs);
    }

    [HttpGet("ByName/{name}")]
    public async Task<ActionResult> GetStaffByName(string name)
    {
        IEnumerable<StaffDTO>? staffDTO = await _staffService.GetStaffByName(name);
        if (staffDTO == null || !staffDTO.Any())
        {
            return NotFound($"Staff with name '{name}' not found.");
        }
        if (staffDTO.Count() == 1)
            return Ok(staffDTO.First());
        return Ok(staffDTO);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<StaffDTO>> GetStaffById(long id)
    {
        StaffDTO? staffDTO = await _staffService.GetStaffByID(id);
        if (staffDTO == null)
        {
            return NotFound($"Staff with ID '{id}' not found.");
        }
        return Ok(staffDTO);
    }

    [HttpGet("ByQualification/{qualificationCode}")]
    public async Task<ActionResult<IEnumerable<StaffDTO>>> GetStaffByQualification(string qualificationCode)
    {
        IEnumerable<StaffDTO>? staffDTO = await _staffService.GetStaffByQualification(qualificationCode);
        if (staffDTO == null || !staffDTO.Any())
        {
            return NotFound($"No staff found with qualification code '{qualificationCode}'.");
        }
        return Ok(staffDTO);
    }

    [HttpGet("ByStatus/{status}")]
    public async Task<ActionResult<IEnumerable<StaffDTO>>> GetStaffByStatus(int status)
    {
        _errorMessages.Clear();
        if (!Enum.IsDefined(typeof(ResourceStatus), status))
        {
            return NotFound();
        }

        ResourceStatus rs = (ResourceStatus)status;

        if (rs != ResourceStatus.Available && rs != ResourceStatus.Unavailable)
        {
            return NotFound();
        }

        IEnumerable<StaffDTO>? staffDTO = await _staffService.GetStaffByStatus(rs, _errorMessages);
        if (_errorMessages.Any())
        {
            if (_errorMessages.Any(msg => msg.Contains("already exists", StringComparison.OrdinalIgnoreCase)))
                return Conflict(_errorMessages);
            return BadRequest(_errorMessages);
        }
        if (staffDTO == null || !staffDTO.Any())
            return NotFound();
        return Ok(staffDTO);
    }

    [HttpPost]
    public async Task<ActionResult<StaffDTO>> PostStaff(StaffDTO staffDTO)
    {
        _errorMessages.Clear();
        if (staffDTO == null)
        {
            return BadRequest("Staff data is null.");
        }
        if (staffDTO.QualificationCodes == null || !staffDTO.QualificationCodes.Any())
        {
            return BadRequest("At least one QualificationCode must be provided to create a Staff.");
        }
        
        StaffDTO? createdStaff = await _staffService.AddStaff(staffDTO, _errorMessages);
        if (createdStaff == null)
        {
            if (_errorMessages.Any(msg => msg.Contains("already exists", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetStaffByName), new { name = createdStaff.Name }, createdStaff);
    }

    [HttpPut("Update/{id}")]
    public async Task<IActionResult> PutStaff(long id, StaffDTO staffDTO)
    {
        _errorMessages.Clear();
        if (staffDTO == null)
        {
            return BadRequest("Staff data must be provided.");
        }
        
        bool wasUpdated = await _staffService.UpdateStaff(id, staffDTO, _errorMessages);
        if (!wasUpdated && _errorMessages.Any())
        {
            if (_errorMessages.Any(msg => msg.Contains("Staff not found", StringComparison.OrdinalIgnoreCase)))
            {
                return NotFound(_errorMessages);
            }
            if (_errorMessages.Any(msg =>
                msg.Contains("already exists", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("Already exists", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return Ok();
    }
}