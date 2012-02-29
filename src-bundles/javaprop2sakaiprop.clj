#!/usr/bin/env clj
; Converts a Java properties file to a Sakai properties file
(:import java.util.Properties java.io.StringReader)

(defn load-properties
  "Loads a Java .properties file."
  [src]
  (let [props (new java.util.Properties)
        reader (new java.io.StringReader (slurp src :encoding "ISO-8859-1"))]
    (do (.load props reader) props)))

; Load a properties file from stdin and print the key-value pairs on stdout
(with-open [out (clojure.java.io/writer System/out :encoding "utf-8")]
  (doseq [file *command-line-args*]
         (doseq [[key val] (seq (load-properties file))]
                (.write out (str key "=" val "\n")))))
