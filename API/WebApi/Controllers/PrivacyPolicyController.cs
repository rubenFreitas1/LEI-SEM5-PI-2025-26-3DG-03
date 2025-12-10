using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Application.Services;
using Application.DTO;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/PrivacyPolicy")]
    public class PrivacyPolicyController : ControllerBase
    {
        private readonly PrivacyPolicyService _privacyPolicyService;

        public PrivacyPolicyController(PrivacyPolicyService privacyPolicyService)
        {
            _privacyPolicyService = privacyPolicyService;
        }

        // Public endpoint - accessible to everyone
        [HttpGet("current")]
        [AllowAnonymous]
        public async Task<ActionResult<PrivacyPolicyDTO>> GetCurrentPrivacyPolicy()
        {
            var policy = await _privacyPolicyService.GetCurrentPrivacyPolicyAsync();
            if (policy == null)
                return NotFound();
            return Ok(policy);
        }

        // Admin only - view history
        [HttpGet("history")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<PrivacyPolicyDTO>>> GetPrivacyPolicyHistory()
        {
            var history = await _privacyPolicyService.GetPrivacyPolicyHistoryAsync();
            return Ok(history);
        }

        // Admin only - create new policy
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PrivacyPolicyDTO>> AddPrivacyPolicy([FromBody] CreatePrivacyPolicyRequest request)
        {
            var policy = await _privacyPolicyService.AddPrivacyPolicyAsync(request.Content);
            return CreatedAtAction(nameof(GetCurrentPrivacyPolicy), new { id = policy.Id }, policy);
        }

        // Check if user needs to see privacy policy notification
        [HttpGet("check-update")]
        [Authorize]
        public async Task<ActionResult<PrivacyPolicyCheckResponse>> CheckPrivacyPolicyUpdate()
        {
            var email = User.FindFirst("https://lapr5/email")?.Value ?? User.FindFirst("email")?.Value;
            
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized("No email claim found in token.");
            }

            var response = await _privacyPolicyService.CheckPrivacyPolicyUpdateAsync(email);
            return Ok(response);
        }

        // Accept privacy policy
        [HttpPost("accept")]
        [Authorize]
        public async Task<ActionResult> AcceptPrivacyPolicy()
        {
            var email = User.FindFirst("https://lapr5/email")?.Value ?? User.FindFirst("email")?.Value;
            
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized("No email claim found in token.");
            }

            var success = await _privacyPolicyService.AcceptPrivacyPolicyByEmailAsync(email);
            
            if (!success)
            {
                return NotFound("User not found.");
            }

            return Ok(new { message = "Privacy policy accepted successfully." });
        }
    }

    public class CreatePrivacyPolicyRequest
    {
        public string Content { get; set; } = string.Empty;
    }

    public class PrivacyPolicyCheckResponse
    {
        public bool HasNewPolicy { get; set; }
        public PrivacyPolicyDTO? CurrentPolicy { get; set; }
    }
}
