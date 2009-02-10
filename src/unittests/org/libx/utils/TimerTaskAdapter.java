package org.libx.utils;

/*
 * TimerTaskAdapter is needed since we cannot implement abstract base classes
 * such as java.util.TimerTask, see 
 * http://blogs.sun.com/sundararajan/entry/implementing_java_interfaces_in_javascript
 *
 * @author Godmar Back
 */
public class TimerTaskAdapter extends java.util.TimerTask 
{
    Runnable runnable;

    public TimerTaskAdapter(Runnable runnable) {
        this.runnable = runnable;
    }

    public void run() {
        this.runnable.run();
    }
}
