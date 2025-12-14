using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Domain.Model;

[ApiController]
[Route("api/DataRequest")]
//[Authorize]
public class DataRequestController : ControllerBase
{
    private readonly DataRequestService _dataRequestService;

    List<string> _errorMessages = new List<string>();


    public DataRequestController(DataRequestService dataRequestService)
    {
        _dataRequestService = dataRequestService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DataRequestDTO>>> GetAllDataRequests()
    {
        IEnumerable<DataRequestDTO> dataRequests = await _dataRequestService.GetAllDataRequests();
        return Ok(dataRequests);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<DataRequestDTO>> GetDataRequestById(long id)
    {
        DataRequestDTO? dataRequest = await _dataRequestService.GetDataRequestById(id);
        if (dataRequest == null)
        {
            return NotFound($"DataRequest with ID '{id}' not found.");
        }
        return Ok(dataRequest);
    }

    [HttpGet("ByEmail/{email}")]
    public async Task<ActionResult<IEnumerable<DataRequestDTO>>> GetDataRequestsByEmail(string email)
    {
        IEnumerable<DataRequestDTO> dataRequests = await _dataRequestService.GetDataRequestsByEmail(email);
        return Ok(dataRequests);
    }

    [HttpGet("ByType/{requestType}")]
    public async Task<ActionResult<IEnumerable<DataRequestDTO>>> GetDataRequestsByType(DataRequestType requestType)
    {
        IEnumerable<DataRequestDTO> dataRequests = await _dataRequestService.GetDataRequestsByType(requestType);
        return Ok(dataRequests);
    }

    [HttpGet("ByStatus/{status}")]
    public async Task<ActionResult<IEnumerable<DataRequestDTO>>> GetDataRequestsByStatus(DataRequestStatus status)
    {
        IEnumerable<DataRequestDTO> dataRequests = await _dataRequestService.GetDataRequestsByStatus(status);
        return Ok(dataRequests);
    }

    [HttpPost]
    public async Task<ActionResult<DataRequestDTO>> PostDataRequest(DataRequestDTO dataRequestDTO)
    {
        if(dataRequestDTO == null)
        {
            return BadRequest("DataRequestDTO cannot be null.");
        }
        DataRequestDTO? createdDataRequest = await _dataRequestService.CreateDataRequest(dataRequestDTO, _errorMessages);
        if(createdDataRequest == null && _errorMessages.Any())
        {
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetDataRequestById), new { id = createdDataRequest!.Id }, createdDataRequest);
    }
}