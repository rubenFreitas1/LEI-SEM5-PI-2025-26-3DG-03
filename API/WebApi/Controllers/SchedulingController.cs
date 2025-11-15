using Microsoft.AspNetCore.Mvc;


namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.Factory;

[ApiController]
[Route("api/Scheduling")]
public class SchedulingController : ControllerBase
{

    private readonly SchedulingService _schedulingService;
    List<string> _errorMessages = new List<string>();

    public SchedulingController(SchedulingService schedulingService)
    {
        _schedulingService = schedulingService;
    }

    [HttpGet]
    public async Task<ActionResult<SchedulingDTO>> GetSchedullingForTargetDay(DateTime targetDay)
    {
        SchedulingDTO? notifications = await _schedulingService.GetSchedulingForTargetDay(targetDay, _errorMessages);
        if (_errorMessages.Count > 0)
        {
            return BadRequest(_errorMessages);
        }
        return Ok(notifications);
    }


}