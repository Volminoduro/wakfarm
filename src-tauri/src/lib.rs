use tauri::command;
use tauri::Manager;
use tauri::State;
use mac_address::get_mac_address;
use sha2::{Sha256, Digest};
use std::sync::atomic::{AtomicBool, Ordering};
use keyring::Entry;

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
fn get_secure_value(key: String) -> Result<String, String> {
    let entry = Entry::new("wakfarm", &key)
        .map_err(|e| format!("Keyring error: {}", e))?;
    
    entry.get_password()
        .map_err(|e| format!("Password not found: {}", e))
}

#[command]
fn set_secure_value(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new("wakfarm", &key)
        .map_err(|e| format!("Keyring error: {}", e))?;
    
    entry.set_password(&value)
        .map_err(|e| format!("Failed to store: {}", e))
}

#[command]
fn delete_secure_value(key: String) -> Result<(), String> {
    let entry = Entry::new("wakfarm", &key)
        .map_err(|e| format!("Keyring error: {}", e))?;
    
    entry.delete_credential()
        .map_err(|e| format!("Failed to delete: {}", e))
}

#[command]
fn enable_autostart() -> Result<(), String> {
    if cfg!(debug_assertions) {
        return Err("Autostart is disabled in dev builds. Use a release build or the installed app.".to_string());
    }
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
    if cfg!(debug_assertions) {
        return Ok(false);
    }
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
fn hide_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide()
            .map_err(|e| format!("Error hiding window: {}", e))
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

struct TraySettings {
    minimize_to_tray: AtomicBool,
}

#[command]
fn set_minimize_to_tray_enabled(enabled: bool, state: State<TraySettings>) {
    state.minimize_to_tray.store(enabled, Ordering::Relaxed);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::{TrayIconBuilder, TrayIconEvent};

    tauri::Builder::default()
        .manage(TraySettings {
            minimize_to_tray: AtomicBool::new(false),
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_machine_id,
            get_secure_value,
            set_secure_value,
            delete_secure_value,
            enable_autostart,
            disable_autostart,
            is_autostart_enabled,
            hide_window,
            show_window,
            set_minimize_to_tray_enabled
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Show window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }

            // Create tray icon menu
            let show_item = MenuItem::with_id(app, "show", "Afficher", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Build tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Set up window close handler to minimize to tray
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        if let Some(tray_state) = app_handle.try_state::<TraySettings>() {
                            if tray_state.minimize_to_tray.load(Ordering::Relaxed) {
                                // Prevent default close and hide window instead
                                api.prevent_close();
                                let _ = window_clone.hide();
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
