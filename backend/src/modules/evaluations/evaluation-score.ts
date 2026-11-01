import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { CriteriaCategory, EvaluationForm, InternshipPeriod } from '../../database/entities.entity';

function averageScore(form: EvaluationForm, category: CriteriaCategory) {
  const scores = form.details
    .filter((detail) => detail.criteria.category === category)
    .map((detail) => new Decimal(detail.score));
  if (!scores.length) throw new BadRequestException(`No submitted scores for ${category}`);
  return scores.reduce((sum, score) => sum.plus(score), new Decimal(0)).div(scores.length);
}

/** Trung bình mỗi nhóm, nhân trọng số của đợt; chỉ làm tròn sau khi tính xong tổng. */
export function calculateEvaluationScores(
  enterprise: EvaluationForm,
  supervisor: EvaluationForm,
  period: InternshipPeriod,
) {
  const enterpriseScore = averageScore(enterprise, CriteriaCategory.ENTERPRISE);
  const processScore = averageScore(supervisor, CriteriaCategory.PROCESS);
  const reportScore = averageScore(supervisor, CriteriaCategory.REPORT);
  const total = enterpriseScore
    .mul(period.enterpriseWeight)
    .plus(processScore.mul(period.supervisorProcessWeight))
    .plus(reportScore.mul(period.supervisorReportWeight));
  return {
    enterpriseScore: enterpriseScore.toFixed(8),
    supervisorProcessScore: processScore.toFixed(8),
    supervisorReportScore: reportScore.toFixed(8),
    calculatedTotalScore: total.toFixed(8),
    totalScore: total.toFixed(2),
  };
}
