const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SMS_MODULE_JAVA = `package com.bancolombia.miapp;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import androidx.core.content.ContextCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class SmsReaderModule extends ReactContextBaseJavaModule {

    public SmsReaderModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "SmsReader";
    }

    @ReactMethod
    public void getAllSms(int maxCount, Promise promise) {
        ReactApplicationContext ctx = getReactApplicationContext();
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_SMS)
                != PackageManager.PERMISSION_GRANTED) {
            promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted");
            return;
        }
        try {
            WritableArray results = Arguments.createArray();
            Uri uri = Uri.parse("content://sms/inbox");
            String[] projection = new String[]{"_id", "address", "body", "date", "read"};
            Cursor cursor = ctx.getContentResolver().query(
                    uri, projection, null, null, "date DESC LIMIT " + maxCount);
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    WritableMap msg = Arguments.createMap();
                    msg.putString("id",      cursor.getString(cursor.getColumnIndexOrThrow("_id")));
                    msg.putString("address", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                    msg.putString("body",    cursor.getString(cursor.getColumnIndexOrThrow("body")));
                    msg.putDouble("date",    cursor.getLong(cursor.getColumnIndexOrThrow("date")));
                    msg.putInt("read",       cursor.getInt(cursor.getColumnIndexOrThrow("read")));
                    results.pushMap(msg);
                }
                cursor.close();
            }
            promise.resolve(results);
        } catch (Exception e) {
            promise.reject("SMS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getLatestSms(String senderFilter, Promise promise) {
        ReactApplicationContext ctx = getReactApplicationContext();
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_SMS)
                != PackageManager.PERMISSION_GRANTED) {
            promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted");
            return;
        }
        try {
            Uri uri = Uri.parse("content://sms/inbox");
            String[] projection = new String[]{"_id", "address", "body", "date"};
            String selection = senderFilter != null && !senderFilter.isEmpty()
                    ? "address LIKE '%" + senderFilter + "%'" : null;
            Cursor cursor = ctx.getContentResolver().query(
                    uri, projection, selection, null, "date DESC LIMIT 1");
            if (cursor != null && cursor.moveToFirst()) {
                WritableMap msg = Arguments.createMap();
                msg.putString("id",      cursor.getString(cursor.getColumnIndexOrThrow("_id")));
                msg.putString("address", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                msg.putString("body",    cursor.getString(cursor.getColumnIndexOrThrow("body")));
                msg.putDouble("date",    cursor.getLong(cursor.getColumnIndexOrThrow("date")));
                cursor.close();
                promise.resolve(msg);
            } else {
                if (cursor != null) cursor.close();
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.reject("SMS_ERROR", e.getMessage());
        }
    }
}
`;

const SMS_PACKAGE_JAVA = `package com.bancolombia.miapp;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class SmsReaderPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext ctx) {
        return Arrays.<NativeModule>asList(new SmsReaderModule(ctx));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext ctx) {
        return Collections.emptyList();
    }
}
`;

const withSmsPermissions = (config) => {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const existingPerms = manifest["uses-permission"] || [];
    const smsPerms = [
      "android.permission.READ_SMS",
      "android.permission.RECEIVE_SMS",
    ];
    for (const perm of smsPerms) {
      if (!existingPerms.find((p) => p.$?.["android:name"] === perm)) {
        existingPerms.push({ $: { "android:name": perm } });
      }
    }
    manifest["uses-permission"] = existingPerms;
    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const packageDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "bancolombia",
        "miapp"
      );
      fs.mkdirSync(packageDir, { recursive: true });

      fs.writeFileSync(path.join(packageDir, "SmsReaderModule.java"), SMS_MODULE_JAVA);
      fs.writeFileSync(path.join(packageDir, "SmsReaderPackage.java"), SMS_PACKAGE_JAVA);

      const mainAppPath = path.join(packageDir, "MainApplication.kt");
      if (fs.existsSync(mainAppPath)) {
        let content = fs.readFileSync(mainAppPath, "utf8");
        if (!content.includes("SmsReaderPackage")) {
          content = content.replace(
            /override fun getPackages\(\).*?\[/s,
            (match) => match + "\n          SmsReaderPackage(),"
          );
          fs.writeFileSync(mainAppPath, content);
        }
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withSmsPermissions;
