using Microsoft.AspNetCore.Mvc;


namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;

[ApiController]
[Route("api/VesselRecord")]

public class VesselRecordController : ControllerBase
{

    private readonly VesselRecordService _vesselRecordService;
    List<string> _errorMessages = new List<string>();

    public VesselRecordController(VesselRecordService vesselRecordService)
    {
        _vesselRecordService = vesselRecordService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VesselRecordDTO>>> GetAllVesselRecords()
    {
        IEnumerable<VesselRecordDTO> vesselRecords = await _vesselRecordService.GetAllVesselRecords();
        return Ok(vesselRecords);
    }

    [HttpGet("ByIMONumber/{imoNumber}")]
    public async Task<ActionResult<VesselRecordDTO>> GetVesselRecordByIMONumber(string imoNumber)
    {
        VesselRecordDTO? vesselRecord = await _vesselRecordService.GetVesselRecordByIMONumber(imoNumber);
        if (vesselRecord == null)
        {
            return NotFound($"Vessel record with IMO number '{imoNumber}' not found.");
        }
        return Ok(vesselRecord);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<VesselRecordDTO>> GetVesselRecordById(long id)
    {
        VesselRecordDTO? vesselRecordDTO = await _vesselRecordService.GetVesselRecordById(id);
        if (vesselRecordDTO == null)
        {
            return NotFound($"Vessel record with ID '{id}' not found.");
        }
        return Ok(vesselRecordDTO);
    }

    [HttpGet("ByVesselName/{name}")]
    public async Task<ActionResult<VesselRecordDTO>> GetVesselRecordByVesselName(string name)
    {
        VesselRecordDTO? vesselRecord = await _vesselRecordService.GetVesselRecordByVesselName(name);
        if (vesselRecord == null)
        {
            return NotFound($"Vessel record with name '{name}' not found.");
        }
        return Ok(vesselRecord);
    }

    [HttpGet("ByOperator/{operatorName}")]
    public async Task<ActionResult<VesselRecordDTO>> GetVesselRecordByOperator(string operatorName)
    {
        VesselRecordDTO? vesselRecord = await _vesselRecordService.GetVesselRecordByOperator(operatorName);
        if (vesselRecord == null)
        {
            return NotFound($"Vessel record with operator '{operatorName}' not found.");
        }
        return Ok(vesselRecord);
    }

    [HttpPut("Update/{imoNumber}")]
    public async Task<IActionResult> PutVesselRecord(string imoNumber, VesselRecordDTO vesselRecordDTO)
    {
        if (imoNumber != vesselRecordDTO.IMONumber)
        {
            return BadRequest("Invalid vessel record data.");
        }
        bool wasUpdated = await _vesselRecordService.UpdateVesselRecord(imoNumber, vesselRecordDTO, _errorMessages);
        if (!wasUpdated && _errorMessages.Any())
        {
            return BadRequest(_errorMessages);
        }
        return Ok();
    }


    [HttpPost]

    public async Task<ActionResult<VesselRecordDTO>> PostVesselRecord(VesselRecordDTO vesselRecordDTO)
    {
        if (vesselRecordDTO == null)
        {
            return BadRequest("Invalid vessel data is null.");
        }

        VesselRecordDTO? createdVesselRecord = await _vesselRecordService.AddVesselRecord(vesselRecordDTO, _errorMessages);
        if (createdVesselRecord == null && _errorMessages.Any())
        {
            if (_errorMessages.Any(e => e.Contains("Vessel Record Already Exists!", StringComparison.OrdinalIgnoreCase)))
                return Conflict(_errorMessages);
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetVesselRecordByIMONumber), new { imoNumber = createdVesselRecord!.IMONumber }, createdVesselRecord);
    }
}

