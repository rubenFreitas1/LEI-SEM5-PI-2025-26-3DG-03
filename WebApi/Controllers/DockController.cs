using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;

[ApiController]
[Route("api/Dock")]
public class DockController : ControllerBase
{
    private readonly DockService _dockService;
    List<string> _errorMessages = new List<string>();

    public DockController(DockService dockService)
    {
        _dockService = dockService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DockDTO>>> GetAllDocks()
    {
        IEnumerable<DockDTO> docks = await _dockService.GetAllDocks();
        return Ok(docks);
    }

    [HttpGet("ByName/{name}")]
    public async Task<ActionResult<DockDTO>> GetDockByName(string name)
    {
        DockDTO? dock = await _dockService.GetDockByName(name);
        if (dock == null)
        {
            return NotFound($"Dock with name '{name}' not found.");
        }
        return Ok(dock);
    }

    [HttpGet("ByLocation/{location}")]
    public async Task<ActionResult<DockDTO>> GetDockByLocation(string location)
    {
        DockDTO? dock = await _dockService.GetDockByLocation(location);
        if (dock == null)
        {
            return NotFound($"Dock with location '{location}' not found.");
        }
        return Ok(dock);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<DockDTO>> GetDockById(int id)
    {
        DockDTO? dockDTO = await _dockService.GetDockById(id);
        if (dockDTO == null)
        {
            return NotFound($"Dock with ID '{id}' not found.");
        }
        return Ok(dockDTO);
    }

    [HttpPost("ByVesselTypes")]
    public async Task<ActionResult<IEnumerable<DockDTO>>> GetDocksByVesselTypes([FromBody] List<int> vesselTypeIds)
    {
        if (vesselTypeIds == null || !vesselTypeIds.Any())
        {
            return BadRequest("You must provide at least one vessel type ID.");
        }
        var docks = await _dockService.GetDocksByVesselTypes(vesselTypeIds.Select(id => (long)id).ToList());
        if (docks == null || !docks.Any())
        {
            return NotFound("No docks found that support all provided vessel types.");
        }

        return Ok(docks);
    }

    [HttpPut("Update/{id}")]
    public async Task<IActionResult> PutDock(long id, DockDTO dockDTO)
    {
        bool wasUpdated = await _dockService.UpdateDock(id, dockDTO, _errorMessages);
        if (!wasUpdated && _errorMessages.Any())
        {
            return BadRequest(_errorMessages);
        }
        return Ok();
    }

    [HttpPost]
    public async Task<ActionResult<DockDTO>> PostDock(DockDTO dockDTO)
    {
        if (dockDTO == null)
        {
            return BadRequest("Dock data must be provided.");
        }

        DockDTO? createdDock = await _dockService.AddDock(dockDTO, _errorMessages);
        if (createdDock == null && _errorMessages.Any())
        {
            if (_errorMessages.Contains($"A dock with the name '{dockDTO.Name}' already exists.") ||
                _errorMessages.Contains($"A dock with the location '{dockDTO.Location}' already exists."))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetDockByName), new { name = createdDock!.Name }, createdDock);
    }
}
