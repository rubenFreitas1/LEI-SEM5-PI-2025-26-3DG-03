using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.Model;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/SystemUser")]
[Authorize]
public class SystemUserController : ControllerBase
{
    private readonly SystemUserService _systemUserService;
    List<string> _errorMessages = new List<string>();

    public SystemUserController(SystemUserService userService)
    {
        _systemUserService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SystemUserDTO>>> GetAllSystemUsers()
    {
        IEnumerable<SystemUserDTO> users = await _systemUserService.GetAllSystemUsers();
        return Ok(users);
    }

    [HttpGet("ByUsername/{username}")]
    public async Task<ActionResult<SystemUserDTO>> GetSystemUserByUsername(string username)
    {
        SystemUserDTO? user = await _systemUserService.GetSystemUserByUsername(username);
        if (user == null)
        {
            return NotFound($"User with username '{username}' not found.");
        }
        return Ok(user);
    }

    [HttpGet("ByEmail/{email}")]
    public async Task<ActionResult<SystemUserDTO>> GetSystemUserByEmail(string email)
    {
        SystemUserDTO? user = await _systemUserService.GetSystemUserByEmail(email);
        if (user == null)
        {
            return NotFound($"User with email '{email}' not found.");
        }
        return Ok(user);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<SystemUserDTO>> GetSystemUserById(int id)
    {
        SystemUserDTO? userDTO = await _systemUserService.GetSystemUserById(id);
        if (userDTO == null)
        {
            return NotFound($"User with ID '{id}' not found.");
        }
        return Ok(userDTO);
    }

    [HttpGet("ByCode/{code}")]
    public async Task<ActionResult<SystemUserDTO>> GetSystemUserByCode(string code)
    {
        SystemUserDTO? user = await _systemUserService.GetSystemUserByCode(code);
        if (user == null)
        {
            return NotFound($"User with code '{code}' not found.");
        }
        return Ok(user);
    }

    [HttpGet("ByRole/{role}")]
    public async Task<ActionResult<IEnumerable<SystemUserDTO>>> GetSystemUsersByRole(SystemRole role)
    {
        IEnumerable<SystemUserDTO> users = await _systemUserService.GetSystemUsersByRoleAsync(role);
        return Ok(users);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("Update/{code}")]
    public async Task<IActionResult> PutSystemUser(string code, SystemUserDTO systemUserDTO)
    {
        if (code != systemUserDTO.Code)
        {
            return BadRequest("Code in the URL does not match Code in the body.");
        }
        if (systemUserDTO == null)
        {
            return BadRequest("SystemUser data is required.");
        }
        bool updateResult = await _systemUserService.UpdateSystemUser(code, systemUserDTO, _errorMessages);
        if (!updateResult && _errorMessages.Any())
        {
            return BadRequest(_errorMessages);
        }
        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<SystemUserDTO>> PostSystemUser(SystemUserDTO systemUserDTO)
    {
        if (systemUserDTO == null)
        {
            return BadRequest("SystemUser data is required.");
        }
        SystemUserDTO? createdSystemUser = await _systemUserService.AddSystemUser(systemUserDTO, _errorMessages);
        if (createdSystemUser == null && _errorMessages.Any())
        {
            if (_errorMessages.Any(e => e.Contains("already exists.", StringComparison.OrdinalIgnoreCase)))
                return Conflict(_errorMessages);
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetSystemUserByCode), new { code = createdSystemUser!.Code }, createdSystemUser);
    }

    [HttpGet("MyIsFirstTime")]
    public async Task<ActionResult> GetMyIsFirstTime()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("user_id")?.Value;
        var email =
                User.FindFirst("https://lapr5/email")?.Value ??
                User.FindFirst("email")?.Value;
        var name = User.FindFirst("name")?.Value;

        Console.WriteLine("AUTH0 EMAIL = " + email);
        Console.WriteLine("AUTH0 USERID = " + userId);
        Console.WriteLine("AUTH0 NAME = " + name);

        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized("No email claim found in Auth0 token.");
        }

        SystemUserDTO? user = await _systemUserService.GetSystemUserByEmail(email);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        Console.WriteLine($"MyIsFirstTime -> user.Code={user.Code}, IsFirstTime={user.IsFirstTime}");
        return Ok(new { userId, name, isFirstTime = user.IsFirstTime, email = user.Email, code = user.Code });
    }

    [HttpGet("MyRole")]
    public async Task<ActionResult> GetMyRole()
    {
        var email =
                User.FindFirst("https://lapr5/email")?.Value ??
                User.FindFirst("email")?.Value;
        Console.WriteLine("AUTH0 EMAIL = " + email);
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized("No email claim found in Auth0 token.");
        }
        SystemUserDTO? user = await _systemUserService.GetSystemUserByEmail(email);
        if (user == null)
        {
            RepresentativeDTO? representative = await _systemUserService.GetRepresentativeByEmail(email);
            if (representative == null)
            {
                return Forbid();
            }
            return Ok(new { role = "Representative" });
        }
        if (user.Status.Equals(SystemUserStatus.Deactivated))
        {
            return Forbid("Access denied.");
        }
        return Ok(new { role = user.Role.ToString() });
    }

    [HttpPost("SendActivationEmail")]
    public async Task<IActionResult> SendActivationEmail()
    {
        var email =
                User.FindFirst("https://lapr5/email")?.Value ??
                User.FindFirst("email")?.Value;
        Console.WriteLine("AUTH0 EMAIL = " + email);
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized("No email claim found in Auth0 token.");
        }
        SystemUserDTO? user = await _systemUserService.GetSystemUserByEmail(email);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        try
        {
            Console.WriteLine($"SendActivationEmail called for user {user.Email} (code={user.Code})");
            bool emailSent = await _systemUserService.SendActivationEmail(user);
            if (!emailSent)
            {
                Console.WriteLine("SendActivationEmail failed: emailService returned false");
                return StatusCode(500, "Failed to send activation email.");
            }

            Console.WriteLine("SendActivationEmail succeeded");
            return Ok($"Activation email sent to {user.Email}.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SendActivationEmail exception: {ex}");
            return StatusCode(500, $"Error sending activation email: {ex.Message}");
        }
    }

    [HttpPost("AcceptPrivacyPolicy")]
    public async Task<IActionResult> AcceptPrivacyPolicy()
    {
        var email =
                User.FindFirst("https://lapr5/email")?.Value ??
                User.FindFirst("email")?.Value;

        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized("No email claim found in token.");
        }

        bool success = await _systemUserService.AcceptPrivacyPolicyByEmail(email);
        if (!success)
        {
            return NotFound("User not found or could not accept privacy policy.");
        }

        return Ok("Privacy policy accepted.");
    }

}