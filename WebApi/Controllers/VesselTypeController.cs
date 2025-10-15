using Microsoft.AspNetCore.Mvc;


namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.Factory;

[ApiController]
[Route("api/VesselType")]
public class VesselTypeController : ControllerBase
{

    private readonly VesselTypeService _vesselTypeService;
    List<string> _errorMessages = new List<string>();

    public VesselTypeController(VesselTypeService vesselTypeService)
    {
        _vesselTypeService = vesselTypeService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VesselTypeDTO>>> GetAllVesselTypes()
    {
        IEnumerable<VesselTypeDTO> vesselTypes = await _vesselTypeService.GetAllVesselTypes();
        return Ok(vesselTypes);
    }

    [HttpGet("ByName/{name}")]
    public async Task<ActionResult<VesselTypeDTO>> GetVesselTypeByName(string name)
    {
        VesselTypeDTO? vesselType = await _vesselTypeService.GetVesselTypeByName(name);
        if (vesselType == null)
        {
            return NotFound($"Vessel type with name '{name}' not found.");
        }
        return Ok(vesselType);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<VesselTypeDTO>> GetVesselTypeById(int id)
    {
        VesselTypeDTO? vesselTypeDTO = await _vesselTypeService.GetVesselTypeByID(id);
        if (vesselTypeDTO == null)
        {
            return NotFound($"Vessel type with ID '{id}' not found.");
        }
        return Ok(vesselTypeDTO);
    }

    [HttpGet("ByDescription/{description}")]
    public async Task<ActionResult<IEnumerable<VesselTypeDTO>>> GetVesselTypeByDescription(string description)
    {
        IEnumerable<VesselTypeDTO?> vesselTypes = await _vesselTypeService.GetVesselTypeByDescription(description);
        if (vesselTypes == null || !vesselTypes.Any())
        {
            return NotFound($"No vessel types found with description containing '{description}'.");
        }
        return Ok(vesselTypes);
    }

    [HttpPut("Update/{id}")]
    public async Task<IActionResult> PutVesselType(long id, VesselTypeDTO vesselTypeDTO)
    {

        bool wasUpdated = await _vesselTypeService.UpdateVesselType(id, vesselTypeDTO, _errorMessages);
        if (!wasUpdated && _errorMessages.Any())
        {
            return BadRequest(_errorMessages);
        }
        return Ok();
    }

    [HttpPost]
    public async Task<ActionResult<VesselTypeDTO>> PostVesselType(VesselTypeDTO vesselTypeDTO)
    {
        if (vesselTypeDTO == null)
        {
            return BadRequest("Vessel type data is null.");
        }

        VesselTypeDTO? createdVesselType = await _vesselTypeService.AddVesselType(vesselTypeDTO, _errorMessages);
        if (createdVesselType == null && _errorMessages.Any())
        {
            if (_errorMessages.Any(e => e.Contains("Vessel Type Already Exists!", StringComparison.OrdinalIgnoreCase)))
                return Conflict(_errorMessages);
            return BadRequest(_errorMessages);
        }

        return CreatedAtAction(nameof(GetVesselTypeByName), new { name = createdVesselType!.Name }, createdVesselType);
    }


}