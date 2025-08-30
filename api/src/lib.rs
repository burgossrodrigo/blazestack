pub mod domain {
    pub mod entities {
        pub mod incident;
    }
    pub mod ports {
        pub mod incident_cache;
    }
    pub mod use_case {
        pub mod post_incident;
    }
}

pub mod infra {
    pub mod handler {
        pub mod incident;
    }
    pub mod redis {
        pub mod incident_cache;
    }
}

pub mod use_case {
    pub mod post_incident;
}
