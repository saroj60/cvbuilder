import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const sendSuccess = <T>(res: Response, statusCode: number, message: string, data?: T) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  } as ApiResponse<T>);
};

export const sendError = (res: Response, statusCode: number, message: string, error?: any) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  } as ApiResponse);
};
