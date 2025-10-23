namespace Application.DTO;

using System.Text.Json.Serialization;
using Domain.Model;

public class DecisionDTO
{
    public long Id { get; set; }
    public long OfficerId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string VesselVisitNotificationCode { get; set; } = null!;
    public string ResponseMessage { get; set; } = string.Empty;

    private DecisionDTO() { }

    public DecisionDTO(long id, string status, string responseMessage, long officerId, string vesselVisitNotificationCode)
    {
        Id = id;
        Status = status;
        ResponseMessage = responseMessage;
        OfficerId = officerId;
        VesselVisitNotificationCode = vesselVisitNotificationCode;
    }
    static public Decision ToDomain(DecisionDTO dto, VesselVisitNotification vesselVisitNotification)
    {
        if (!Enum.TryParse(dto.Status, true, out DecisionStatus status))
            throw new ArgumentException("Invalid Decision Status, must be either 'Approved' or 'Rejected'.");

        return new Decision(
            status,
            dto.ResponseMessage,
            dto.OfficerId,
            vesselVisitNotification
        );
    }

    static public DecisionDTO ToDTO(Decision decision)
    {
        return new DecisionDTO
        (
            decision.Id,
            decision.Status.ToString(),
            decision.ResponseMessage,
            decision.OfficerId,
            decision.VesselVisitNotification.Code
        );
    }

    static public IEnumerable<DecisionDTO> ToDTO(IEnumerable<Decision> decisions)
    {
        List<DecisionDTO> decisionDTOs = new List<DecisionDTO>();
        foreach (Decision decision in decisions)
        {
            DecisionDTO decisionDTO = ToDTO(decision);
            decisionDTOs.Add(decisionDTO);
        }
        return decisionDTOs;
    }
}