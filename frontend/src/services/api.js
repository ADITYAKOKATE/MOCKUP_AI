import { authService } from './auth.service';
import { dashboardService } from './dashboard.service';
import { testService } from './test.service';
import { analysisService } from './analysis.service';
import { insightService } from './insight.service';
import { testSessionService } from './testSession.service';
import { aiService } from './ai.service';
import { assistantService, API_PYTHON_URL } from './assistant.service.js';

export const api = {
    ...authService,
    ...dashboardService,
    ...testService,
    ...analysisService,
    ...insightService,
    ...testSessionService,
    ...aiService,
    ...assistantService,
    API_PYTHON_URL
};

