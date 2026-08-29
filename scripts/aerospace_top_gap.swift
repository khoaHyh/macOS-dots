#!/usr/bin/env swift

import AppKit
import CoreGraphics
import Darwin
import Foundation

let targetWindowTop = 40.0
let minimumOuterGap = 10.0

func requiredOuterGap(auxiliaryTopHeight: Double, menuBarHidden: Bool) -> Int {
    let topAreaUsedByUbersicht = menuBarHidden ? auxiliaryTopHeight : 0
    return Int(max(minimumOuterGap, ceil(targetWindowTop - topAreaUsedByUbersicht)))
}

func printUsageAndExit() -> Never {
    let usage = "Usage: aerospace_top_gap.swift [--geometry <auxiliary-top-height> <true|false>]\n"
    FileHandle.standardError.write(Data(usage.utf8))
    exit(2)
}

let arguments = Array(CommandLine.arguments.dropFirst())
if !arguments.isEmpty {
    guard arguments.count == 3,
          arguments[0] == "--geometry",
          let auxiliaryTopHeight = Double(arguments[1]),
          ["true", "false"].contains(arguments[2])
    else {
        printUsageAndExit()
    }

    print(requiredOuterGap(
        auxiliaryTopHeight: auxiliaryTopHeight,
        menuBarHidden: arguments[2] == "true"
    ))
    exit(0)
}

let builtInScreen = NSScreen.screens.first { screen in
    guard let screenNumber = screen.deviceDescription[
        NSDeviceDescriptionKey("NSScreenNumber")
    ] as? NSNumber else {
        return false
    }
    return CGDisplayIsBuiltin(CGDirectDisplayID(screenNumber.uint32Value)) != 0
}

guard let screen = builtInScreen else {
    print(Int(targetWindowTop))
    exit(0)
}

let auxiliaryTopHeight = screen.auxiliaryTopLeftArea?.height ?? 0
let ubersichtWindowHeight = screen.visibleFrame.height
    + (screen.visibleFrame.minY - screen.frame.minY)
let unavailableHeight = screen.frame.height - ubersichtWindowHeight

// Mirrors Übersicht's test for whether its widget window expands into the notch area.
let menuBarHidden = abs(unavailableHeight - auxiliaryTopHeight) < 0.5

print(requiredOuterGap(
    auxiliaryTopHeight: auxiliaryTopHeight,
    menuBarHidden: menuBarHidden
))
