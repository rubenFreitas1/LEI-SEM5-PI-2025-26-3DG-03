using Microsoft.AspNetCore.Mvc;


namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;

[ApiController]
[Route("api/ShippingAgentOrganization")]

public class ShippingAgentOrganizationController : ControllerBase
{
    private readonly ShippingAgentOrganizationService _shippingAgentOrganizationService;

    List<string> _errorMessages = new List<string>();

    public ShippingAgentOrganizationController(ShippingAgentOrganizationService shippingAgentOrganizationService)
    {
        _shippingAgentOrganizationService = shippingAgentOrganizationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShippingAgentOrganizationDTO>>> GetAllShippingAgentOrganizations()
    {
        IEnumerable<ShippingAgentOrganizationDTO> organizations = await _shippingAgentOrganizationService.GetAllShippingAgentOrganizations();
        return Ok(organizations);
    }

    [HttpGet("ByCode/{code}")]
    public async Task<ActionResult<ShippingAgentOrganizationDTO>> GetShippingAgentOrganizationByCode(string code)
    {
        ShippingAgentOrganizationDTO? organization = await _shippingAgentOrganizationService.GetShippingAgentOrganizationByCode(code);
        if (organization == null)
        {
            return NotFound($"Shipping Agent Organization with code '{code}' not found.");
        }
        return Ok(organization);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<ShippingAgentOrganizationDTO>> GetShippingAgentOrganizationById(long id)
    {
        ShippingAgentOrganizationDTO? organizationDTO = await _shippingAgentOrganizationService.GetShippingAgentOrganizationById(id);
        if (organizationDTO == null)
        {
            return NotFound($"Shipping Agent Organization with ID '{id}' not found.");
        }
        return Ok(organizationDTO);
    }

    [HttpGet("ByLegalName/{legalName}")]
    public async Task<ActionResult<ShippingAgentOrganizationDTO>> GetShippingAgentOrganizationByLegalName(string legalName)
    {
        ShippingAgentOrganizationDTO? organization = await _shippingAgentOrganizationService.GetShippingAgentOrganizationByLegalName(legalName);
        if (organization == null)
        {
            return NotFound($"Shipping Agent Organization with legal name '{legalName}' not found.");
        }
        return Ok(organization);
    }

    [HttpGet("ByAlternativeName/{alternativeName}")]
    public async Task<ActionResult<ShippingAgentOrganizationDTO>> GetShippingAgentOrganizationByAlternativeName(string alternativeName)
    {
        ShippingAgentOrganizationDTO? organization = await _shippingAgentOrganizationService.GetShippingAgentOrganizationByAlternativeName(alternativeName);
        if (organization == null)
        {
            return NotFound($"Shipping Agent Organization with alternative name '{alternativeName}' not found.");
        }
        return Ok(organization);
    }

    [HttpGet("ByTaxNumber/{taxNumber}")]
    public async Task<ActionResult<ShippingAgentOrganizationDTO>> GetShippingAgentOrganizationByTaxNumber(string taxNumber)
    {
        ShippingAgentOrganizationDTO? organization = await _shippingAgentOrganizationService.GetShippingAgentOrganizationByTaxNumber(taxNumber);
        if (organization == null)
        {
            return NotFound($"Shipping Agent Organization with tax number '{taxNumber}' not found.");
        }
        return Ok(organization);
    }

    [HttpGet("ByAdress/{address}")]
    public async Task<ActionResult<ShippingAgentOrganizationDTO>> GetShippingAgentOrganizationByAddress(string address)
    {
        ShippingAgentOrganizationDTO? organization = await _shippingAgentOrganizationService.GetShippingAgentOrganizationByAddress(address);
        if (organization == null)
        {
            return NotFound($"Shipping Agent Organization with address '{address}' not found.");
        }
        return Ok(organization);
    }

    [HttpPut("Update/{id}")]
    public async Task<IActionResult> PutShippingAgentOrganization(long id, ShippingAgentOrganizationDTO organizationDTO)
    {
        if (organizationDTO == null)
        {
            return BadRequest("Organization data is required.");
        }

        bool wasUpdated = await _shippingAgentOrganizationService.UpdateShippingAgentOrganization(id, organizationDTO, _errorMessages);
        if (!wasUpdated && _errorMessages.Any())
        {
            if (_errorMessages.Any(msg =>
                msg.Contains("already exists", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }

        return Ok();
    }

    [HttpPost]
    public async Task<ActionResult<ShippingAgentOrganizationWithRepresentativeDTO>> PostShippingAgentOrganization(ShippingAgentOrganizationWithRepresentativeDTO organizationRepDTO)
    {
        if (organizationRepDTO == null)
        {
            return BadRequest("Organization data is required.");
        }

        var validationErrors = new List<string>();
        if (string.IsNullOrWhiteSpace(organizationRepDTO.Code))
            validationErrors.Add("Code is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.LegalName))
            validationErrors.Add("LegalName is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.AlternativeName))
            validationErrors.Add("AlternativeName is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.Address))
            validationErrors.Add("Address is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.TaxNumber))
            validationErrors.Add("TaxNumber is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.RepresentativeName))
            validationErrors.Add("RepresentativeName is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.RepresentativeCitizenId))
            validationErrors.Add("RepresentativeCitizenId is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.RepresentativeNationality))
            validationErrors.Add("RepresentativeNationality is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.RepresentativeEmail))
            validationErrors.Add("RepresentativeEmail is required and cannot be empty.");
        if (string.IsNullOrWhiteSpace(organizationRepDTO.RepresentativePhoneNumber))
            validationErrors.Add("RepresentativePhoneNumber is required and cannot be empty.");

        if (validationErrors.Any())
        {
            return BadRequest(validationErrors);
        }

        ShippingAgentOrganizationWithRepresentativeDTO? createdOrganization = await _shippingAgentOrganizationService.AddShippingAgentOrganizationWithRepresentative(organizationRepDTO, _errorMessages);
        if (createdOrganization == null && _errorMessages.Any())
        {
            if (_errorMessages.Any(e => e.Contains("Shipping Agent Organization Already Exists!", StringComparison.OrdinalIgnoreCase)))
                return Conflict(_errorMessages);
            return BadRequest(_errorMessages);
        }

        return CreatedAtAction(nameof(GetShippingAgentOrganizationById), new { id = createdOrganization!.Id }, createdOrganization);
    }

}