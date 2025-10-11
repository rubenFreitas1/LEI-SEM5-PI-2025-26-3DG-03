using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;

[ApiController]
[Route("api/Qualification")]
public class QualificationController : ControllerBase
{
    private readonly QualificationService _qualificationService;
    List<string> _errorMessages = new List<string>();

    public QualificationController(QualificationService qualificationService)
    {
        _qualificationService = qualificationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QualificationDTO>>> GetAll()
    {
        var qs = await _qualificationService.GetAllQualifications();
        return Ok(qs);
    }

    [HttpGet("ByCode/{code}")]
    public async Task<ActionResult<QualificationDTO>> GetByCode(string code)
    {
        var q = await _qualificationService.GetByCode(code);
        if (q == null) return NotFound($"Qualification with code '{code}' not found.");
        return Ok(q);
    }

    [HttpGet("ByName/{name}")]
    public async Task<ActionResult<IEnumerable<QualificationDTO>>> GetByName(string name)
    {
        var qs = await _qualificationService.GetByName(name);
        if (qs == null || !qs.Any()) return NotFound($"No qualifications found with name containing '{name}'.");
        return Ok(qs);
    }

    [HttpPost]
    public async Task<ActionResult<QualificationDTO>> Create(QualificationDTO dto)
    {
        if (dto == null) return BadRequest("Qualification data is required.");

        var created = await _qualificationService.AddQualification(dto, _errorMessages);
        if (created == null && _errorMessages.Any()) return BadRequest(_errorMessages);

        return CreatedAtAction(nameof(GetByCode), new { code = created!.Code }, created);
    }

    [HttpPut("Update/{id}")]
    public async Task<IActionResult> Update(long id, QualificationUpdateDTO dto)
    {
        if (dto == null)
        {
            return BadRequest("Invalid qualification data.");
        }

        var ok = await _qualificationService.UpdateQualificationNameAndDescription(id, dto, _errorMessages);
        if (!ok && _errorMessages.Any()) return BadRequest(_errorMessages);
        if (!ok) return NotFound("Qualification not found or not updated.");

        return Ok();
    }

}
