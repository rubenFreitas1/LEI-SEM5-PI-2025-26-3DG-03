using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
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

    [HttpGet("ByName/{name}")]
    public async Task<ActionResult<StaffDTO>> GetStaffByName(string name)
    {
        StaffDTO? staffDTO = await _staffService.GetStaffByName(name);
        if (staffDTO == null)
        {
            return NotFound($"Staff with name '{name}' not found.");
        }
        return Ok(staffDTO);
    }

    [HttpPost]
    public async Task<ActionResult<StaffDTO>> PostStaff(StaffDTO staffDTO)
    {
        if (staffDTO == null)
        {
            return BadRequest("Staff data is null.");
        }

        StaffDTO? createdStaff = await _staffService.AddStaff(staffDTO, _errorMessages);
        if (createdStaff == null)
        {
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetStaffByName), new { name = createdStaff.Name }, createdStaff);
    }
}