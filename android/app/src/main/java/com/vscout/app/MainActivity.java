package com.vscout.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;
import com.capacitorjs.plugins.filesystem.FilesystemPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Registrando explicitamente para garantir que o Capacitor localize o plugin
    registerPlugin(GoogleAuth.class);
    registerPlugin(FilesystemPlugin.class);
  }
}
