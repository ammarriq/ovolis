#include <napi.h>
#include <windows.h>
#include <string>
#include <vector>
#include <algorithm>
#include <iostream>

struct WindowInfo {
    HWND hwnd;
    std::string title;
};

std::vector<WindowInfo> windows;

BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam) {
    if (IsWindow(hwnd)) {
        int titleLength = GetWindowTextLengthA(hwnd);
        if (titleLength > 0) {
            std::string title(titleLength + 1, '\0');
            int actualLength = GetWindowTextA(hwnd, &title[0], titleLength + 1);
            if (actualLength > 0) {
                title.resize(actualLength);
                windows.push_back({hwnd, title});
            }
        }
    }
    return TRUE;
}

HWND FindWindowByTitle(const std::string& windowTitle) {
    // Try exact match first
    HWND hwnd = FindWindowA(nullptr, windowTitle.c_str());
    if (hwnd != nullptr) {
        return hwnd;
    }

    // If exact match fails, enumerate all windows and find partial match
    windows.clear();
    EnumWindows(EnumWindowsProc, 0);

    // Convert to lowercase for case-insensitive comparison
    std::string lowerTitle = windowTitle;
    std::transform(lowerTitle.begin(), lowerTitle.end(), lowerTitle.begin(), ::tolower);

    for (const auto& window : windows) {
        std::string lowerWindowTitle = window.title;
        std::transform(lowerWindowTitle.begin(), lowerWindowTitle.end(), lowerWindowTitle.begin(), ::tolower);
        
        if (lowerWindowTitle.find(lowerTitle) != std::string::npos || 
            lowerTitle.find(lowerWindowTitle) != std::string::npos) {
            return window.hwnd;
        }
    }

    return nullptr;
}

Napi::Value ResizeWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: appName, width, height")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsString() || !info[1].IsNumber() || !info[2].IsNumber()) {
        Napi::TypeError::New(env, "Invalid argument types")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string appName = info[0].As<Napi::String>().Utf8Value();
    int width = info[1].As<Napi::Number>().Int32Value();
    int height = info[2].As<Napi::Number>().Int32Value();

    try {
        // Store the current foreground window to restore focus later
        HWND currentForegroundWindow = GetForegroundWindow();
        
        // Find the window by title
        HWND hwnd = FindWindowByTitle(appName);
        
        if (hwnd == nullptr) {
            return Napi::String::New(env, "❌ Window '" + appName + "' not found. Make sure the application is running and the window title is correct.");
        }

        // Verify the window is valid
        if (!IsWindow(hwnd)) {
            return Napi::String::New(env, "❌ Invalid window handle for '" + appName + "'.");
        }

        // Get current window position
        RECT rect;
        if (!GetWindowRect(hwnd, &rect)) {
            return Napi::String::New(env, "❌ Failed to get current window position for '" + appName + "'.");
        }

        int currentX = rect.left;
        int currentY = rect.top;

        // Log current window dimensions for debugging
        int currentWidth = rect.right - rect.left;
        int currentHeight = rect.bottom - rect.top;
        std::cout << "Current window size: " << currentWidth << "x" << currentHeight << std::endl;
        std::cout << "Target size: " << width << "x" << height << std::endl;

        // Check if window is maximized and restore it first
        WINDOWPLACEMENT wp;
        wp.length = sizeof(WINDOWPLACEMENT);
        if (GetWindowPlacement(hwnd, &wp)) {
            if (wp.showCmd == SW_SHOWMAXIMIZED) {
                std::cout << "Window is maximized, restoring first..." << std::endl;
                ShowWindow(hwnd, SW_RESTORE);
                // Wait a bit for the window to restore
                Sleep(100);
            }
        }

        // Try multiple approaches to resize the window without changing focus
        BOOL success = FALSE;
        
        // Approach 1: SetWindowPos without changing focus or z-order
        success = SetWindowPos(
            hwnd,
            nullptr,
            currentX,
            currentY,
            width,
            height,
            SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED
        );
        
        if (!success) {
            // Approach 2: Try with different flags but still no activation
            success = SetWindowPos(
                hwnd,
                nullptr,
                currentX,
                currentY,
                width,
                height,
                SWP_NOZORDER | SWP_NOACTIVATE
            );
        }
        
        if (!success) {
            // Approach 3: Try MoveWindow as fallback
            success = MoveWindow(hwnd, currentX, currentY, width, height, TRUE);
        }

        if (success) {
            // Restore focus to the original window if it's still valid
            if (currentForegroundWindow && IsWindow(currentForegroundWindow)) {
                SetForegroundWindow(currentForegroundWindow);
                std::cout << "Focus restored to original window" << std::endl;
            }
            
            // Verify the resize actually happened
            RECT newRect;
            if (GetWindowRect(hwnd, &newRect)) {
                int newWidth = newRect.right - newRect.left;
                int newHeight = newRect.bottom - newRect.top;
                std::cout << "New window size: " << newWidth << "x" << newHeight << std::endl;
                
                if (newWidth == width && newHeight == height) {
                    return Napi::String::New(env, "✅ Successfully resized '" + appName + "' to " + 
                        std::to_string(width) + "x" + std::to_string(height) + " pixels using native Windows API (focus preserved).");
                } else {
                    return Napi::String::New(env, "⚠️ SetWindowPos succeeded but window size didn't change. Current: " + 
                        std::to_string(newWidth) + "x" + std::to_string(newHeight) + ", Expected: " + 
                        std::to_string(width) + "x" + std::to_string(height) + " (focus preserved)");
                }
            } else {
                return Napi::String::New(env, "✅ SetWindowPos succeeded for '" + appName + "' to " + 
                    std::to_string(width) + "x" + std::to_string(height) + " pixels (verification failed, focus preserved).");
            }
        } else {
            // Restore focus even if resize failed
            if (currentForegroundWindow && IsWindow(currentForegroundWindow)) {
                SetForegroundWindow(currentForegroundWindow);
            }
            DWORD error = GetLastError();
            return Napi::String::New(env, "❌ Failed to resize '" + appName + "'. Error code: " + std::to_string(error));
        }
    } catch (const std::exception& e) {
        return Napi::String::New(env, "❌ Native API error: " + std::string(e.what()));
    }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "resizeWindow"),
                Napi::Function::New(env, ResizeWindow));
    return exports;
}

NODE_API_MODULE(window_resizer, Init)