-- Update admin password
UPDATE users 
SET password = '$2a$10$hQ/WQdC7uGgEpXx1os4pKepZdg6ppabIhFIBcpgrOFcsYw4AGvlpi'
WHERE email = 'admin@logistics.com';

-- Update dispatcher password  
UPDATE users 
SET password = '$2a$10$vMIxpbS/4yzcppZWDlGLx.xHsJoCDGI.sALMAr6zFVbTineLCJy9C'
WHERE email = 'dispatcher@logistics.com';

-- Update accountant password
UPDATE users 
SET password = '$2a$10$yWFIBfyDSttXCsrDUYUiM.G6YXfJyk/8elcGPTbbHvMQEiUp/kq4a'
WHERE email = 'accountant@logistics.com';