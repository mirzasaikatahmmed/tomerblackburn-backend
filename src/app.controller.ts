import { Controller, Get, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AppService } from './app.service';
import * as packageJson from '../package.json';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Welcome message' })
  @ApiResponse({ status: 200, description: 'Returns welcome message' })
  async getHomePage(@Res() res: Response) {
    const baseUrl =
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
    const environment = process.env.NODE_ENV || 'development';
    const isProduction = environment === 'production';
    const version = packageJson.version;
    const appVersion =
      (global as any).APP_VERSION || process.env.APP_VERSION || 'unknown';

    const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BBurn Builders API</title>
            <style>
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }

              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
                color: #e0e7ff;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }

              .container {
                max-width: 600px;
                width: 100%;
              }

              .card {
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(51, 65, 85, 0.5);
                border-radius: 16px;
                padding: 48px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              }

              h1 {
                font-size: 2.5rem;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 16px;
                letter-spacing: -0.5px;
              }

              .description {
                color: #94a3b8;
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 24px;
              }

              .badge {
                display: inline-block;
                background: rgba(59, 130, 246, 0.2);
                color: #60a5fa;
                padding: 6px 16px;
                border-radius: 6px;
                font-size: 0.875rem;
                font-weight: 500;
                margin-bottom: 32px;
                border: 1px solid rgba(59, 130, 246, 0.3);
              }

              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 32px;
              }

              .info-box {
                background: rgba(30, 41, 59, 0.5);
                border: 1px solid rgba(51, 65, 85, 0.4);
                border-radius: 12px;
                padding: 20px;
              }

              .info-label {
                color: #64748b;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
              }

              .info-value {
                color: #ffffff;
                font-size: 1.125rem;
                font-weight: 600;
              }

              .status-online {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .status-dot {
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                animation: pulse 2s infinite;
              }

              @keyframes pulse {
                0%, 100% {
                  opacity: 1;
                  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                }
                50% {
                  opacity: 0.8;
                  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
                }
              }

              .links {
                display: flex;
                flex-direction: column;
                gap: 12px;
              }

              .link-button {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                background: rgba(30, 41, 59, 0.5);
                border: 1px solid rgba(51, 65, 85, 0.4);
                border-radius: 10px;
                color: #e0e7ff;
                text-decoration: none;
                font-size: 0.95rem;
                transition: all 0.2s ease;
              }

              .link-button:hover {
                background: rgba(30, 41, 59, 0.8);
                border-color: rgba(59, 130, 246, 0.5);
                transform: translateX(4px);
              }

              .link-icon {
                font-size: 1.2rem;
              }

              .footer {
                text-align: center;
                color: #64748b;
                font-size: 0.875rem;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid rgba(51, 65, 85, 0.3);
              }

              @media (max-width: 640px) {
                .card {
                  padding: 32px 24px;
                }

                h1 {
                  font-size: 2rem;
                }

                .info-grid {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>bburn_builders_api</h1>
                <p class="description">
                  Backend API for BBurn Builders — a professional bathroom renovation estimator
                  with cost calculation, PDF generation, and project management.
                </p>

                <span class="badge">Backend Service</span>

                <div class="info-grid">
                  <div class="info-box">
                    <div class="info-label">Release Version</div>
                    <div class="info-value">v${version}</div>
                  </div>
                  <div class="info-box">
                    <div class="info-label">Deployment Version</div>
                    <div class="info-value">${appVersion}</div>
                  </div>
                  <div class="info-box">
                    <div class="info-label">Environment</div>
                    <div class="info-value">${environment}</div>
                  </div>
                  <div class="info-box">
                    <div class="info-label">Status</div>
                    <div class="info-value status-online">
                      <span class="status-dot"></span>
                      <span>Online</span>
                    </div>
                  </div>
                </div>

                <div class="links">
                  <a href="/api" class="link-button">
                    <span class="link-icon">📘</span>
                    <span>API Documentation</span>
                  </a>
                  <a href="/health" class="link-button">
                    <span class="link-icon">❤️</span>
                    <span>Health Check</span>
                  </a>
                </div>

                <div class="footer">
                  &copy; 2026 BBurn Builders - All rights reserved
                </div>
              </div>
            </div>

            <script>
              // Check API health status
              async function checkHealth() {
                try {
                  const response = await fetch('/health');
                  const statusElement = document.querySelector('.status-online span:last-child');
                  const dotElement = document.querySelector('.status-dot');

                  if (response.ok) {
                    statusElement.textContent = 'Online';
                    dotElement.style.background = '#10b981';
                  } else {
                    statusElement.textContent = 'Degraded';
                    dotElement.style.background = '#f59e0b';
                  }
                } catch (error) {
                  const statusElement = document.querySelector('.status-online span:last-child');
                  const dotElement = document.querySelector('.status-dot');
                  statusElement.textContent = 'Offline';
                  dotElement.style.background = '#ef4444';
                  dotElement.style.animation = 'none';
                }
              }

              // Check health on load
              checkHealth();

              // Refresh health status every 30 seconds
              setInterval(checkHealth, 30000);
            </script>
          </body>
          </html>
        `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Returns health status and developer information',
  })
  async getHealthCheck() {
    try {
      return await this.appService.getHealthCheck();
    } catch (error) {
      throw error;
    }
  }
}
