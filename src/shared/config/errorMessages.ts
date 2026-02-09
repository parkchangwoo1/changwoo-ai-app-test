export interface ApiErrorInfo {
  code: string | null;
  type: string;
  message: string;
  status: number;
}

export const ERROR_MESSAGES: Record<string, string> = {
  'invalid_request_error': '잘못된 요청입니다.',
  'authentication_error': 'API 인증에 실패했습니다.',
  'permission_error': 'API 접근 권한이 없습니다.',
  'rate_limit_error': 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  'api_error': 'API 서버 오류가 발생했습니다.',
  'overloaded_error': 'API 서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
  'invalid_api_key': 'API 키가 유효하지 않습니다.',
  'insufficient_quota': 'API 사용량 한도에 도달했습니다.',
  'model_not_found': '요청한 모델을 찾을 수 없습니다.',
  'context_length_exceeded': '대화 내용이 너무 깁니다. 새 대화를 시작해주세요.',
  'content_policy_violation': '콘텐츠 정책 위반으로 요청이 거부되었습니다.',
  'image_not_supported': '이 모델은 이미지를 지원하지 않습니다.',
  'network_error': '네트워크 연결을 확인해주세요.',
  'unknown_error': '알 수 없는 오류가 발생했습니다.',
};

export function getErrorMessage(errorType: string, originalMessage?: string): string {
  return ERROR_MESSAGES[errorType] || originalMessage || ERROR_MESSAGES['unknown_error'];
}

export function parseApiError(status: number, errorData: { error?: { type?: string; code?: string | null; message?: string } }): ApiErrorInfo {
  const error = errorData?.error || {};

  return {
    code: error.code || null,
    type: error.type || 'unknown_error',
    message: error.message || '',
    status,
  };
}
