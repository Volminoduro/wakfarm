use tauri::command;
use tauri::Manager;
use mac_address::get_mac_address;
use sha2::{Sha256, Digest};

#[command]
fn get_machine_id() -> Result<String, String> {
    match get_mac_address() {
        Ok(Some(mac)) => {
            let mut hasher = Sha256::new();
            hasher.update(mac.to_string().as_bytes());
            let hash = hasher.finalize();
            Ok(format!("{:x}", hash))
        }
        _ => Err("Impossible de récupérer l'adresse MAC".to_string()),
    }
}

#[command]
fn enable_autostart() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::env;
        use winreg::RegKey;
        use winreg::enums::HKEY_CURRENT_USER;

        let app_path = env::current_exe()
            .map_err(|e| format!("Error getting app path: {}", e))?;
        let run_key = RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags("Software\\Microsoft\\Windows\\CurrentVersion\\Run", winreg::enums::KEY_WRITE)
            .map_err(|e| format!("Error opening registry: {}", e))?;
        
        run_key.set_value("Wakfarm", &app_path.to_string_lossy().to_string())
            .map_err(|e| format!("Error writing registry: {}", e))?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Autostart is only supported on Windows".to_string())
    }
}

#[command]
fn disable_autostart() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::HKEY_CURRENT_USER;

        let run_key = RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags("Software\\Microsoft\\Windows\\CurrentVersion\\Run", winreg::enums::KEY_WRITE)
            .map_err(|e| format!("Error opening registry: {}", e))?;
        
        run_key.delete_value("Wakfarm")
            .map_err(|e| format!("Error deleting registry value: {}", e))?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Autostart is only supported on Windows".to_string())
    }
}

#[command]
fn is_autostart_enabled() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::HKEY_CURRENT_USER;

        let run_key = RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags("Software\\Microsoft\\Windows\\CurrentVersion\\Run", winreg::enums::KEY_READ)
            .map_err(|e| format!("Error opening registry: {}", e))?;
        
        match run_key.get_value::<String, &str>("Wakfarm") {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Autostart is only supported on Windows".to_string())
    }
}

#[command]
fn minimize_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize()
            .map_err(|e| format!("Error minimizing window: {}", e))
    } else {
        Err("Window not found".to_string())
    }
}

#[command]
fn show_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show()
            .map_err(|e| format!("Error showing window: {}", e))?;
        window.set_focus()
            .map_err(|e| format!("Error setting focus: {}", e))
    } else {
        Err("Window not found".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_machine_id,
            enable_autostart,
            disable_autostart,
            is_autostart_enabled,
            minimize_window,
            show_window
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
