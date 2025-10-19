using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;

[ApiController]
[Route("api/StorageArea")]
public class StorageAreaController : ControllerBase
{
    private readonly StorageAreaService _storageAreaService;
    List<string> _errorMessages = new List<string>();

    public StorageAreaController(StorageAreaService storageAreaService)
    {
        _storageAreaService = storageAreaService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StorageAreaDTO>>> GetAllStorageAreas()
    {
        IEnumerable<StorageAreaDTO> storageAreas = await _storageAreaService.GetAllStorageAreas();
        return Ok(storageAreas);
    }

    [HttpGet("ByCode/{code}")]
    public async Task<ActionResult<StorageAreaDTO>> GetStorageAreaByCode(string code)
    {
        StorageAreaDTO? storageArea = await _storageAreaService.GetStorageAreaByCode(code);
        if (storageArea == null)
        {
            return NotFound($"Storage Area with code '{code}' not found.");
        }
        return Ok(storageArea);
    }

    [HttpGet("ById/{id}")]
    public async Task<ActionResult<StorageAreaDTO>> GetStorageAreaById(int id)
    {
        StorageAreaDTO? storageAreaDTO = await _storageAreaService.GetStorageAreaById(id);
        if (storageAreaDTO == null)
        {
            return NotFound($"Storage Area with ID '{id}' not found.");
        }
        return Ok(storageAreaDTO);
    }

    [HttpGet("ByLocation/{location}")]
    public async Task<ActionResult<StorageAreaDTO>> GetStorageAreaByLocation(string location)
    {
        StorageAreaDTO? storageAreaDTO = await _storageAreaService.GetStorageAreaByLocation(location);
        if (storageAreaDTO == null)
        {
            return NotFound($"Storage Area with location '{location}' not found.");
        }
        return Ok(storageAreaDTO);
    }

    [HttpPost]
    public async Task<ActionResult<StorageAreaDTO>> PostStorageArea([FromBody] StorageAreaDTO storageAreaDTO)
    {
        if (storageAreaDTO == null)
        {
            return BadRequest("Storage Area data must be provided.");
        }

        StorageAreaDTO? createdStorageAreaDTO = await _storageAreaService.AddStorageArea(storageAreaDTO, _errorMessages);
        if (createdStorageAreaDTO == null || _errorMessages.Any())
        {
            if (_errorMessages.Contains("Storage area with this code already exists.") ||
               _errorMessages.Contains("Storage area with this location already exists."))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetStorageAreaById), new { id = createdStorageAreaDTO.Id }, createdStorageAreaDTO);
    }
    
    [HttpPut("Update/{id}")]
    public async Task<IActionResult> PutStorageArea(long id, StorageAreaDTO storageAreaDTO)
    {
        if (storageAreaDTO == null)
        {
            return BadRequest("Storage Area data must be provided.");
        }
        bool wasUpdated = await _storageAreaService.UpdateStorageArea(id, storageAreaDTO, _errorMessages);
        if (!wasUpdated && _errorMessages.Any())
        {
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