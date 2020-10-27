(define-map store ((key (buff 32))) ((value (buff 32))))

(define-public (get-value (key (buff 32)))
    (match (map-get? store ((key key)))
        entry (ok (get value entry))
        (err 0)))

(define-public (set-value (key (buff 32)) (value (buff 32)))
    (begin
        (map-set store ((key key)) ((value value)))
        (ok 'true)))
