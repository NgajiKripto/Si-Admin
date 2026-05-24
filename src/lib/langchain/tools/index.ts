import { searchKnowledgeTool } from "./search-knowledge";
import { checkStockTool } from "./check-stock";
import { createFollowUpTool } from "./create-follow-up";
import { getCustomerHistoryTool } from "./get-customer-history";
import { sendFeedbackTemplateTool } from "./send-feedback-template";
import { updateStockTool } from "./update-stock";

export {
  searchKnowledgeTool,
  checkStockTool,
  createFollowUpTool,
  getCustomerHistoryTool,
  sendFeedbackTemplateTool,
  updateStockTool,
};

/**
 * Mengembalikan semua tools yang tersedia untuk agent.
 */
export function getAgentTools() {
  return [
    searchKnowledgeTool,
    checkStockTool,
    createFollowUpTool,
    getCustomerHistoryTool,
    sendFeedbackTemplateTool,
    updateStockTool,
  ];
}
